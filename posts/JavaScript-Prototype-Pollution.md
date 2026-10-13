---
title: JavaScript Prototype Pollution
summary: "Explanation of the Prototype Pollution Vulnerability"
tag: vulnerabilities
date: 2026-09-15
---

Prototype pollution is an injection attack that targets JavaScript runtimes where an attacker can add or modify properties on an object's prototype so the new values can appear on all objects on your application. So, it can lead to application logic manipulation, privileges escalation, DoS, RCE, XSS.

Before delving into the topic of "Prototype Pollution," we first need to understand JavaScript objects.

## what is a JavaScript Object prototype?

JavaScript Object is a type of data structure that stores information as key-value pairs

```js
const person = {
  name: "0xmg",
  greet: function () {
    console.log("Hello, my name is " + this.name);
  },
};
```

When we create a new object that inherits properties from another object whether that object is the base `Object` or another object, the mechanism used by JavaScript is called the **prototype**

A prototype is an object that another object uses to inherit shared properties and methods. However, the object does not directly get properties from the prototype. First, JavaScript searches within the object's own properties, if not found, it continues up the prototype chain (its prototype, then that prototype's prototype, and so on) until it finds the property or reaches null.

![](/images/posts/pp_1.png)

To access the prototype, we use:

- `Object.prototype` is the object that actually holds the shared methods: the actual prototype object that contains all the built‑in methods.
- `obj.__proto__` points to `Object.prototype`: this is the link inside your object that tells JavaScript which prototype object it should use.

## Basics of Prototype Pollution:

The properties of prototypes are not fixed, we can modify them or even create new prototypes, and any changes will be applied to all objects that inherit from them.

So, if we change inherited properties from another object, those changes will affect all objects that inherit from it.

![](/images/posts/pp_2.png)

However, if we modify properties of `Object.prototype`, the changes will affect every object in the environment, since all objects ultimately inherit from `Object.prototype`.

![](/images/posts/pp_3.png)

Let's take a look at the real impact of this on both the client side and the server side.

## Server-Side Prototype Pollution (SSPP)

let's take a scenario where we have [an application](https://github.com/Mgh-Zakariae/Prototype_Pollution_demo/tree/main/SSPP) where users can update their delivery address.

In server side we will find the code where it uses a recursive merge function to update user profiles with whatever data they send.

```js
let userSession = {
  username: "alice",
  address: "123 Main St",
};

function unsafeMerge(target, source) {
  for (let key in source) {
    if (typeof target[key] === "object" && typeof source[key] === "object") {
      unsafeMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
}

app.post("/api/update-profile", (req, res) => {
  unsafeMerge(userSession, req.body);
  res.json({ status: "Profile updated!" });
});
```

The normal request:

```http
POST /api/update-profile HTTP/1.1
Host: example.com
Cookie: session=XXXXX
Content-Type: application/json
Content-Length: 48

{
  "address": "123 Main St"
}
```

The user just edits his address and everything is good.

But if the attacker wants to access to admin panel, he notices the application takes JSON input to update profiles. he sends a malicious payload using magic `__proto__` property :

```http
POST /api/update-profile HTTP/1.1
Host: example.com
Cookie: session=XXXXX
Content-Type: application/json
Content-Length: 75

{
    "address": "456 Hack Way",
    "__proto__": {
        "isAdmin": true
    }
}
```

The request will be accepted because the server merges the JSON payload into an object using a vulnerable function (or a vulnerable library). Because this function does not filter out `__proto__`, it applies changes to the prototype chain instead of just adding an individual property (like address).

Furthermore, since the `userSession` object used in the code does not define an `isAdmin` property, when the server checks `userSession.isAdmin`, Node.js looks up the prototype chain. It then retrieves the malicious value injected by the attacker.

![](/images/posts/pp_4.png)

## Client-Side Prototype Pollution (CSPP)

Client-side prototype pollution is prototype pollution that happens and is exploited entirely inside the browser.

You find a way to write attacker-controlled data onto `Object.prototype` (often via an unsafe merge, or parsing something like a URL/query string), and then some code — our app, or a library like jQuery/lodash — reads an unguarded property off an object and uses it in a way that leads to script execution (XSS), since that's the main capability a browser gadget gives you.

### Scenario

[The app](https://github.com/Mgh-Zakariae/Prototype_Pollution_demo/tree/main/CSPP) allows users to store personal settings as JSON on the server. These settings are later merged back into a client‑side JavaScript object using a recursive merge function that does not filter out the special `__proto__` key.

Because JSON treats `__proto__` as a normal key, the server stores it and returns it unchanged. When the client merges this data, it pollutes `Object.prototype` for the entire page.

At first, the pollution seems harmless. But when another feature — the pet activity feed — runs through jQuery's AJAX logic, jQuery uses `for...in` to read internal settings. This picks up the attacker‑injected properties from `Object.prototype`. As a result, jQuery misinterprets the attacker's string as HTML, inserts it into the DOM, and executes the embedded script.

### How we can confirm prototype pollution

The first thing is that by reading main.js, we can see a vulnerable function that does not filter out `__proto__`

```js
const mergeSettings = (target, source) => {
  for (let key in source) {
    if (typeof target[key] === "object" && typeof source[key] === "object") {
      mergeSettings(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
};
```

The second step is testing: we send a malicious payload and then check whether the prototype has been polluted.

```
curl.exe -X POST "http://localhost:8080/api/settings" -H "Content-Type: application/json" -d '{\"__proto__\": {\"polluted\": true}}' -H "Cookie: session=<SESSION>"
```

![](/images/posts/pp_5.png)

With this, we confirm that both the server and main.js fail to sanitize user input, allowing prototype pollution through the `__proto__` property.

### The gadget (jQuery.ajax internals, jquery-3.6.0.min.js)

The app calls `$.get('/api/pet/activity', ...)` in `loadActivity()`. That's just a shortcut for a plain, harmless AJAX request — normally nothing in it reads from `Object.prototype` in a dangerous way.

The problem is that jQuery never checks whether a setting like `context` is one the caller actually set, or one it merely inherited from `Object.prototype`. In plain English: jQuery asks "does this request have a context option?", and because of the pollution, every object in the page now answers "yes" — even though nobody set it directly on this particular request.

So after the pollution:

- jQuery thinks `context: "<img src=x onerror=...>"` was passed in.
- jQuery thinks `jquery: "x"` was passed in too.
- Seeing both set, jQuery runs `jQuery(context)` to wrap that value — but instead of a safe object, `context` is an attacker-controlled string that looks like HTML.
- jQuery interprets any string starting with `<` as HTML to build, not as plain text, so it creates a real `<img>` element from it.
- That `<img>` has a broken `src`, so its `onerror` handler fires immediately — and that handler is the attacker's JavaScript.

**In short:** a completely normal `$.get()` call becomes the trigger, simply because the polluted `Object.prototype` makes jQuery believe options were passed that never actually were.

```
curl.exe -X POST "http://localhost:8080/api/settings" -H "Content-Type: application/json" -d '{\"__proto__\": {\"context\": \"<img src=xx onerror=alert(12)>\", \"jquery\": \"xxx\"}}' -H "Cookie: session=<SESSION>"
```

![](/images/posts/pp_6.png)

## resources

- [https://www.vaadata.com/en/blog/what-is-prototype-pollution-exploitations-and-security-tips/](https://www.vaadata.com/en/blog/what-is-prototype-pollution-exploitations-and-security-tips/)
- [https://github.com/BlackFan/client-side-prototype-pollution](https://github.com/BlackFan/client-side-prototype-pollution)
- [https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)
- [https://www.telerik.com/blogs/understand-prototypes-prototypal-inheritance-javascript](https://www.telerik.com/blogs/understand-prototypes-prototypal-inheritance-javascript)
- [https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Advanced_JavaScript_objects/Object_prototypes](https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Advanced_JavaScript_objects/Object_prototypes)
- [https://blog.vidocsecurity.com/blog/beginners-guide-to-understanding-client-prototype-pollution](https://blog.vidocsecurity.com/blog/beginners-guide-to-understanding-client-prototype-pollution)
- [https://learn.snyk.io/lesson/prototype-pollution/?ecosystem=javascript](https://learn.snyk.io/lesson/prototype-pollution/?ecosystem=javascript)
- [https://developer.mozilla.org/en-US/docs/Web/Security/Attacks/Prototype_pollution](https://developer.mozilla.org/en-US/docs/Web/Security/Attacks/Prototype_pollution)
