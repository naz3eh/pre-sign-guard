"use strict";
var PreSignGuard = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __esm = (fn, res, err) => function __init() {
    if (err) throw err[0];
    try {
      return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
    } catch (e) {
      throw err = [e], e;
    }
  };
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // node_modules/abitype/dist/esm/version.js
  var version;
  var init_version = __esm({
    "node_modules/abitype/dist/esm/version.js"() {
      version = "1.2.3";
    }
  });

  // node_modules/abitype/dist/esm/errors.js
  var BaseError;
  var init_errors = __esm({
    "node_modules/abitype/dist/esm/errors.js"() {
      init_version();
      BaseError = class _BaseError extends Error {
        constructor(shortMessage, args = {}) {
          const details = args.cause instanceof _BaseError ? args.cause.details : args.cause?.message ? args.cause.message : args.details;
          const docsPath = args.cause instanceof _BaseError ? args.cause.docsPath || args.docsPath : args.docsPath;
          const message = [
            shortMessage || "An error occurred.",
            "",
            ...args.metaMessages ? [...args.metaMessages, ""] : [],
            ...docsPath ? [`Docs: https://abitype.dev${docsPath}`] : [],
            ...details ? [`Details: ${details}`] : [],
            `Version: abitype@${version}`
          ].join("\n");
          super(message);
          Object.defineProperty(this, "details", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
          });
          Object.defineProperty(this, "docsPath", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
          });
          Object.defineProperty(this, "metaMessages", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
          });
          Object.defineProperty(this, "shortMessage", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
          });
          Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "AbiTypeError"
          });
          if (args.cause)
            this.cause = args.cause;
          this.details = details;
          this.docsPath = docsPath;
          this.metaMessages = args.metaMessages;
          this.shortMessage = shortMessage;
        }
      };
    }
  });

  // node_modules/abitype/dist/esm/regex.js
  function execTyped(regex, string) {
    const match = regex.exec(string);
    return match?.groups;
  }
  var bytesRegex, integerRegex, isTupleRegex;
  var init_regex = __esm({
    "node_modules/abitype/dist/esm/regex.js"() {
      bytesRegex = /^bytes([1-9]|1[0-9]|2[0-9]|3[0-2])?$/;
      integerRegex = /^u?int(8|16|24|32|40|48|56|64|72|80|88|96|104|112|120|128|136|144|152|160|168|176|184|192|200|208|216|224|232|240|248|256)?$/;
      isTupleRegex = /^\(.+?\).*?$/;
    }
  });

  // node_modules/abitype/dist/esm/human-readable/formatAbiParameter.js
  function formatAbiParameter(abiParameter) {
    let type = abiParameter.type;
    if (tupleRegex.test(abiParameter.type) && "components" in abiParameter) {
      type = "(";
      const length = abiParameter.components.length;
      for (let i = 0; i < length; i++) {
        const component = abiParameter.components[i];
        type += formatAbiParameter(component);
        if (i < length - 1)
          type += ", ";
      }
      const result2 = execTyped(tupleRegex, abiParameter.type);
      type += `)${result2?.array || ""}`;
      return formatAbiParameter({
        ...abiParameter,
        type
      });
    }
    if ("indexed" in abiParameter && abiParameter.indexed)
      type = `${type} indexed`;
    if (abiParameter.name)
      return `${type} ${abiParameter.name}`;
    return type;
  }
  var tupleRegex;
  var init_formatAbiParameter = __esm({
    "node_modules/abitype/dist/esm/human-readable/formatAbiParameter.js"() {
      init_regex();
      tupleRegex = /^tuple(?<array>(\[(\d*)\])*)$/;
    }
  });

  // node_modules/abitype/dist/esm/human-readable/formatAbiParameters.js
  function formatAbiParameters(abiParameters) {
    let params = "";
    const length = abiParameters.length;
    for (let i = 0; i < length; i++) {
      const abiParameter = abiParameters[i];
      params += formatAbiParameter(abiParameter);
      if (i !== length - 1)
        params += ", ";
    }
    return params;
  }
  var init_formatAbiParameters = __esm({
    "node_modules/abitype/dist/esm/human-readable/formatAbiParameters.js"() {
      init_formatAbiParameter();
    }
  });

  // node_modules/abitype/dist/esm/human-readable/formatAbiItem.js
  function formatAbiItem(abiItem) {
    if (abiItem.type === "function")
      return `function ${abiItem.name}(${formatAbiParameters(abiItem.inputs)})${abiItem.stateMutability && abiItem.stateMutability !== "nonpayable" ? ` ${abiItem.stateMutability}` : ""}${abiItem.outputs?.length ? ` returns (${formatAbiParameters(abiItem.outputs)})` : ""}`;
    if (abiItem.type === "event")
      return `event ${abiItem.name}(${formatAbiParameters(abiItem.inputs)})`;
    if (abiItem.type === "error")
      return `error ${abiItem.name}(${formatAbiParameters(abiItem.inputs)})`;
    if (abiItem.type === "constructor")
      return `constructor(${formatAbiParameters(abiItem.inputs)})${abiItem.stateMutability === "payable" ? " payable" : ""}`;
    if (abiItem.type === "fallback")
      return `fallback() external${abiItem.stateMutability === "payable" ? " payable" : ""}`;
    return "receive() external payable";
  }
  var init_formatAbiItem = __esm({
    "node_modules/abitype/dist/esm/human-readable/formatAbiItem.js"() {
      init_formatAbiParameters();
    }
  });

  // node_modules/abitype/dist/esm/human-readable/runtime/signatures.js
  function isErrorSignature(signature) {
    return errorSignatureRegex.test(signature);
  }
  function execErrorSignature(signature) {
    return execTyped(errorSignatureRegex, signature);
  }
  function isEventSignature(signature) {
    return eventSignatureRegex.test(signature);
  }
  function execEventSignature(signature) {
    return execTyped(eventSignatureRegex, signature);
  }
  function isFunctionSignature(signature) {
    return functionSignatureRegex.test(signature);
  }
  function execFunctionSignature(signature) {
    return execTyped(functionSignatureRegex, signature);
  }
  function isStructSignature(signature) {
    return structSignatureRegex.test(signature);
  }
  function execStructSignature(signature) {
    return execTyped(structSignatureRegex, signature);
  }
  function isConstructorSignature(signature) {
    return constructorSignatureRegex.test(signature);
  }
  function execConstructorSignature(signature) {
    return execTyped(constructorSignatureRegex, signature);
  }
  function isFallbackSignature(signature) {
    return fallbackSignatureRegex.test(signature);
  }
  function execFallbackSignature(signature) {
    return execTyped(fallbackSignatureRegex, signature);
  }
  function isReceiveSignature(signature) {
    return receiveSignatureRegex.test(signature);
  }
  var errorSignatureRegex, eventSignatureRegex, functionSignatureRegex, structSignatureRegex, constructorSignatureRegex, fallbackSignatureRegex, receiveSignatureRegex, eventModifiers, functionModifiers;
  var init_signatures = __esm({
    "node_modules/abitype/dist/esm/human-readable/runtime/signatures.js"() {
      init_regex();
      errorSignatureRegex = /^error (?<name>[a-zA-Z$_][a-zA-Z0-9$_]*)\((?<parameters>.*?)\)$/;
      eventSignatureRegex = /^event (?<name>[a-zA-Z$_][a-zA-Z0-9$_]*)\((?<parameters>.*?)\)$/;
      functionSignatureRegex = /^function (?<name>[a-zA-Z$_][a-zA-Z0-9$_]*)\((?<parameters>.*?)\)(?: (?<scope>external|public{1}))?(?: (?<stateMutability>pure|view|nonpayable|payable{1}))?(?: returns\s?\((?<returns>.*?)\))?$/;
      structSignatureRegex = /^struct (?<name>[a-zA-Z$_][a-zA-Z0-9$_]*) \{(?<properties>.*?)\}$/;
      constructorSignatureRegex = /^constructor\((?<parameters>.*?)\)(?:\s(?<stateMutability>payable{1}))?$/;
      fallbackSignatureRegex = /^fallback\(\) external(?:\s(?<stateMutability>payable{1}))?$/;
      receiveSignatureRegex = /^receive\(\) external payable$/;
      eventModifiers = /* @__PURE__ */ new Set(["indexed"]);
      functionModifiers = /* @__PURE__ */ new Set([
        "calldata",
        "memory",
        "storage"
      ]);
    }
  });

  // node_modules/abitype/dist/esm/human-readable/errors/abiItem.js
  var UnknownTypeError, UnknownSolidityTypeError;
  var init_abiItem = __esm({
    "node_modules/abitype/dist/esm/human-readable/errors/abiItem.js"() {
      init_errors();
      UnknownTypeError = class extends BaseError {
        constructor({ type }) {
          super("Unknown type.", {
            metaMessages: [
              `Type "${type}" is not a valid ABI type. Perhaps you forgot to include a struct signature?`
            ]
          });
          Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "UnknownTypeError"
          });
        }
      };
      UnknownSolidityTypeError = class extends BaseError {
        constructor({ type }) {
          super("Unknown type.", {
            metaMessages: [`Type "${type}" is not a valid ABI type.`]
          });
          Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "UnknownSolidityTypeError"
          });
        }
      };
    }
  });

  // node_modules/abitype/dist/esm/human-readable/errors/abiParameter.js
  var InvalidParameterError, SolidityProtectedKeywordError, InvalidModifierError, InvalidFunctionModifierError, InvalidAbiTypeParameterError;
  var init_abiParameter = __esm({
    "node_modules/abitype/dist/esm/human-readable/errors/abiParameter.js"() {
      init_errors();
      InvalidParameterError = class extends BaseError {
        constructor({ param }) {
          super("Invalid ABI parameter.", {
            details: param
          });
          Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "InvalidParameterError"
          });
        }
      };
      SolidityProtectedKeywordError = class extends BaseError {
        constructor({ param, name }) {
          super("Invalid ABI parameter.", {
            details: param,
            metaMessages: [
              `"${name}" is a protected Solidity keyword. More info: https://docs.soliditylang.org/en/latest/cheatsheet.html`
            ]
          });
          Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "SolidityProtectedKeywordError"
          });
        }
      };
      InvalidModifierError = class extends BaseError {
        constructor({ param, type, modifier }) {
          super("Invalid ABI parameter.", {
            details: param,
            metaMessages: [
              `Modifier "${modifier}" not allowed${type ? ` in "${type}" type` : ""}.`
            ]
          });
          Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "InvalidModifierError"
          });
        }
      };
      InvalidFunctionModifierError = class extends BaseError {
        constructor({ param, type, modifier }) {
          super("Invalid ABI parameter.", {
            details: param,
            metaMessages: [
              `Modifier "${modifier}" not allowed${type ? ` in "${type}" type` : ""}.`,
              `Data location can only be specified for array, struct, or mapping types, but "${modifier}" was given.`
            ]
          });
          Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "InvalidFunctionModifierError"
          });
        }
      };
      InvalidAbiTypeParameterError = class extends BaseError {
        constructor({ abiParameter }) {
          super("Invalid ABI parameter.", {
            details: JSON.stringify(abiParameter, null, 2),
            metaMessages: ["ABI parameter type is invalid."]
          });
          Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "InvalidAbiTypeParameterError"
          });
        }
      };
    }
  });

  // node_modules/abitype/dist/esm/human-readable/errors/signature.js
  var InvalidSignatureError, UnknownSignatureError, InvalidStructSignatureError;
  var init_signature = __esm({
    "node_modules/abitype/dist/esm/human-readable/errors/signature.js"() {
      init_errors();
      InvalidSignatureError = class extends BaseError {
        constructor({ signature, type }) {
          super(`Invalid ${type} signature.`, {
            details: signature
          });
          Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "InvalidSignatureError"
          });
        }
      };
      UnknownSignatureError = class extends BaseError {
        constructor({ signature }) {
          super("Unknown signature.", {
            details: signature
          });
          Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "UnknownSignatureError"
          });
        }
      };
      InvalidStructSignatureError = class extends BaseError {
        constructor({ signature }) {
          super("Invalid struct signature.", {
            details: signature,
            metaMessages: ["No properties exist."]
          });
          Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "InvalidStructSignatureError"
          });
        }
      };
    }
  });

  // node_modules/abitype/dist/esm/human-readable/errors/struct.js
  var CircularReferenceError;
  var init_struct = __esm({
    "node_modules/abitype/dist/esm/human-readable/errors/struct.js"() {
      init_errors();
      CircularReferenceError = class extends BaseError {
        constructor({ type }) {
          super("Circular reference detected.", {
            metaMessages: [`Struct "${type}" is a circular reference.`]
          });
          Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "CircularReferenceError"
          });
        }
      };
    }
  });

  // node_modules/abitype/dist/esm/human-readable/errors/splitParameters.js
  var InvalidParenthesisError;
  var init_splitParameters = __esm({
    "node_modules/abitype/dist/esm/human-readable/errors/splitParameters.js"() {
      init_errors();
      InvalidParenthesisError = class extends BaseError {
        constructor({ current, depth }) {
          super("Unbalanced parentheses.", {
            metaMessages: [
              `"${current.trim()}" has too many ${depth > 0 ? "opening" : "closing"} parentheses.`
            ],
            details: `Depth "${depth}"`
          });
          Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "InvalidParenthesisError"
          });
        }
      };
    }
  });

  // node_modules/abitype/dist/esm/human-readable/runtime/cache.js
  function getParameterCacheKey(param, type, structs) {
    let structKey = "";
    if (structs)
      for (const struct of Object.entries(structs)) {
        if (!struct)
          continue;
        let propertyKey = "";
        for (const property of struct[1]) {
          propertyKey += `[${property.type}${property.name ? `:${property.name}` : ""}]`;
        }
        structKey += `(${struct[0]}{${propertyKey}})`;
      }
    if (type)
      return `${type}:${param}${structKey}`;
    return `${param}${structKey}`;
  }
  var parameterCache;
  var init_cache = __esm({
    "node_modules/abitype/dist/esm/human-readable/runtime/cache.js"() {
      parameterCache = /* @__PURE__ */ new Map([
        // Unnamed
        ["address", { type: "address" }],
        ["bool", { type: "bool" }],
        ["bytes", { type: "bytes" }],
        ["bytes32", { type: "bytes32" }],
        ["int", { type: "int256" }],
        ["int256", { type: "int256" }],
        ["string", { type: "string" }],
        ["uint", { type: "uint256" }],
        ["uint8", { type: "uint8" }],
        ["uint16", { type: "uint16" }],
        ["uint24", { type: "uint24" }],
        ["uint32", { type: "uint32" }],
        ["uint64", { type: "uint64" }],
        ["uint96", { type: "uint96" }],
        ["uint112", { type: "uint112" }],
        ["uint160", { type: "uint160" }],
        ["uint192", { type: "uint192" }],
        ["uint256", { type: "uint256" }],
        // Named
        ["address owner", { type: "address", name: "owner" }],
        ["address to", { type: "address", name: "to" }],
        ["bool approved", { type: "bool", name: "approved" }],
        ["bytes _data", { type: "bytes", name: "_data" }],
        ["bytes data", { type: "bytes", name: "data" }],
        ["bytes signature", { type: "bytes", name: "signature" }],
        ["bytes32 hash", { type: "bytes32", name: "hash" }],
        ["bytes32 r", { type: "bytes32", name: "r" }],
        ["bytes32 root", { type: "bytes32", name: "root" }],
        ["bytes32 s", { type: "bytes32", name: "s" }],
        ["string name", { type: "string", name: "name" }],
        ["string symbol", { type: "string", name: "symbol" }],
        ["string tokenURI", { type: "string", name: "tokenURI" }],
        ["uint tokenId", { type: "uint256", name: "tokenId" }],
        ["uint8 v", { type: "uint8", name: "v" }],
        ["uint256 balance", { type: "uint256", name: "balance" }],
        ["uint256 tokenId", { type: "uint256", name: "tokenId" }],
        ["uint256 value", { type: "uint256", name: "value" }],
        // Indexed
        [
          "event:address indexed from",
          { type: "address", name: "from", indexed: true }
        ],
        ["event:address indexed to", { type: "address", name: "to", indexed: true }],
        [
          "event:uint indexed tokenId",
          { type: "uint256", name: "tokenId", indexed: true }
        ],
        [
          "event:uint256 indexed tokenId",
          { type: "uint256", name: "tokenId", indexed: true }
        ]
      ]);
    }
  });

  // node_modules/abitype/dist/esm/human-readable/runtime/utils.js
  function parseSignature(signature, structs = {}) {
    if (isFunctionSignature(signature))
      return parseFunctionSignature(signature, structs);
    if (isEventSignature(signature))
      return parseEventSignature(signature, structs);
    if (isErrorSignature(signature))
      return parseErrorSignature(signature, structs);
    if (isConstructorSignature(signature))
      return parseConstructorSignature(signature, structs);
    if (isFallbackSignature(signature))
      return parseFallbackSignature(signature);
    if (isReceiveSignature(signature))
      return {
        type: "receive",
        stateMutability: "payable"
      };
    throw new UnknownSignatureError({ signature });
  }
  function parseFunctionSignature(signature, structs = {}) {
    const match = execFunctionSignature(signature);
    if (!match)
      throw new InvalidSignatureError({ signature, type: "function" });
    const inputParams = splitParameters(match.parameters);
    const inputs = [];
    const inputLength = inputParams.length;
    for (let i = 0; i < inputLength; i++) {
      inputs.push(parseAbiParameter(inputParams[i], {
        modifiers: functionModifiers,
        structs,
        type: "function"
      }));
    }
    const outputs = [];
    if (match.returns) {
      const outputParams = splitParameters(match.returns);
      const outputLength = outputParams.length;
      for (let i = 0; i < outputLength; i++) {
        outputs.push(parseAbiParameter(outputParams[i], {
          modifiers: functionModifiers,
          structs,
          type: "function"
        }));
      }
    }
    return {
      name: match.name,
      type: "function",
      stateMutability: match.stateMutability ?? "nonpayable",
      inputs,
      outputs
    };
  }
  function parseEventSignature(signature, structs = {}) {
    const match = execEventSignature(signature);
    if (!match)
      throw new InvalidSignatureError({ signature, type: "event" });
    const params = splitParameters(match.parameters);
    const abiParameters = [];
    const length = params.length;
    for (let i = 0; i < length; i++)
      abiParameters.push(parseAbiParameter(params[i], {
        modifiers: eventModifiers,
        structs,
        type: "event"
      }));
    return { name: match.name, type: "event", inputs: abiParameters };
  }
  function parseErrorSignature(signature, structs = {}) {
    const match = execErrorSignature(signature);
    if (!match)
      throw new InvalidSignatureError({ signature, type: "error" });
    const params = splitParameters(match.parameters);
    const abiParameters = [];
    const length = params.length;
    for (let i = 0; i < length; i++)
      abiParameters.push(parseAbiParameter(params[i], { structs, type: "error" }));
    return { name: match.name, type: "error", inputs: abiParameters };
  }
  function parseConstructorSignature(signature, structs = {}) {
    const match = execConstructorSignature(signature);
    if (!match)
      throw new InvalidSignatureError({ signature, type: "constructor" });
    const params = splitParameters(match.parameters);
    const abiParameters = [];
    const length = params.length;
    for (let i = 0; i < length; i++)
      abiParameters.push(parseAbiParameter(params[i], { structs, type: "constructor" }));
    return {
      type: "constructor",
      stateMutability: match.stateMutability ?? "nonpayable",
      inputs: abiParameters
    };
  }
  function parseFallbackSignature(signature) {
    const match = execFallbackSignature(signature);
    if (!match)
      throw new InvalidSignatureError({ signature, type: "fallback" });
    return {
      type: "fallback",
      stateMutability: match.stateMutability ?? "nonpayable"
    };
  }
  function parseAbiParameter(param, options) {
    const parameterCacheKey = getParameterCacheKey(param, options?.type, options?.structs);
    if (parameterCache.has(parameterCacheKey))
      return parameterCache.get(parameterCacheKey);
    const isTuple = isTupleRegex.test(param);
    const match = execTyped(isTuple ? abiParameterWithTupleRegex : abiParameterWithoutTupleRegex, param);
    if (!match)
      throw new InvalidParameterError({ param });
    if (match.name && isSolidityKeyword(match.name))
      throw new SolidityProtectedKeywordError({ param, name: match.name });
    const name = match.name ? { name: match.name } : {};
    const indexed = match.modifier === "indexed" ? { indexed: true } : {};
    const structs = options?.structs ?? {};
    let type;
    let components = {};
    if (isTuple) {
      type = "tuple";
      const params = splitParameters(match.type);
      const components_ = [];
      const length = params.length;
      for (let i = 0; i < length; i++) {
        components_.push(parseAbiParameter(params[i], { structs }));
      }
      components = { components: components_ };
    } else if (match.type in structs) {
      type = "tuple";
      components = { components: structs[match.type] };
    } else if (dynamicIntegerRegex.test(match.type)) {
      type = `${match.type}256`;
    } else if (match.type === "address payable") {
      type = "address";
    } else {
      type = match.type;
      if (!(options?.type === "struct") && !isSolidityType(type))
        throw new UnknownSolidityTypeError({ type });
    }
    if (match.modifier) {
      if (!options?.modifiers?.has?.(match.modifier))
        throw new InvalidModifierError({
          param,
          type: options?.type,
          modifier: match.modifier
        });
      if (functionModifiers.has(match.modifier) && !isValidDataLocation(type, !!match.array))
        throw new InvalidFunctionModifierError({
          param,
          type: options?.type,
          modifier: match.modifier
        });
    }
    const abiParameter = {
      type: `${type}${match.array ?? ""}`,
      ...name,
      ...indexed,
      ...components
    };
    parameterCache.set(parameterCacheKey, abiParameter);
    return abiParameter;
  }
  function splitParameters(params, result2 = [], current = "", depth = 0) {
    const length = params.trim().length;
    for (let i = 0; i < length; i++) {
      const char = params[i];
      const tail = params.slice(i + 1);
      switch (char) {
        case ",":
          return depth === 0 ? splitParameters(tail, [...result2, current.trim()]) : splitParameters(tail, result2, `${current}${char}`, depth);
        case "(":
          return splitParameters(tail, result2, `${current}${char}`, depth + 1);
        case ")":
          return splitParameters(tail, result2, `${current}${char}`, depth - 1);
        default:
          return splitParameters(tail, result2, `${current}${char}`, depth);
      }
    }
    if (current === "")
      return result2;
    if (depth !== 0)
      throw new InvalidParenthesisError({ current, depth });
    result2.push(current.trim());
    return result2;
  }
  function isSolidityType(type) {
    return type === "address" || type === "bool" || type === "function" || type === "string" || bytesRegex.test(type) || integerRegex.test(type);
  }
  function isSolidityKeyword(name) {
    return name === "address" || name === "bool" || name === "function" || name === "string" || name === "tuple" || bytesRegex.test(name) || integerRegex.test(name) || protectedKeywordsRegex.test(name);
  }
  function isValidDataLocation(type, isArray) {
    return isArray || type === "bytes" || type === "string" || type === "tuple";
  }
  var abiParameterWithoutTupleRegex, abiParameterWithTupleRegex, dynamicIntegerRegex, protectedKeywordsRegex;
  var init_utils = __esm({
    "node_modules/abitype/dist/esm/human-readable/runtime/utils.js"() {
      init_regex();
      init_abiItem();
      init_abiParameter();
      init_signature();
      init_splitParameters();
      init_cache();
      init_signatures();
      abiParameterWithoutTupleRegex = /^(?<type>[a-zA-Z$_][a-zA-Z0-9$_]*(?:\spayable)?)(?<array>(?:\[\d*?\])+?)?(?:\s(?<modifier>calldata|indexed|memory|storage{1}))?(?:\s(?<name>[a-zA-Z$_][a-zA-Z0-9$_]*))?$/;
      abiParameterWithTupleRegex = /^\((?<type>.+?)\)(?<array>(?:\[\d*?\])+?)?(?:\s(?<modifier>calldata|indexed|memory|storage{1}))?(?:\s(?<name>[a-zA-Z$_][a-zA-Z0-9$_]*))?$/;
      dynamicIntegerRegex = /^u?int$/;
      protectedKeywordsRegex = /^(?:after|alias|anonymous|apply|auto|byte|calldata|case|catch|constant|copyof|default|defined|error|event|external|false|final|function|immutable|implements|in|indexed|inline|internal|let|mapping|match|memory|mutable|null|of|override|partial|private|promise|public|pure|reference|relocatable|return|returns|sizeof|static|storage|struct|super|supports|switch|this|true|try|typedef|typeof|var|view|virtual)$/;
    }
  });

  // node_modules/abitype/dist/esm/human-readable/runtime/structs.js
  function parseStructs(signatures) {
    const shallowStructs = {};
    const signaturesLength = signatures.length;
    for (let i = 0; i < signaturesLength; i++) {
      const signature = signatures[i];
      if (!isStructSignature(signature))
        continue;
      const match = execStructSignature(signature);
      if (!match)
        throw new InvalidSignatureError({ signature, type: "struct" });
      const properties = match.properties.split(";");
      const components = [];
      const propertiesLength = properties.length;
      for (let k = 0; k < propertiesLength; k++) {
        const property = properties[k];
        const trimmed = property.trim();
        if (!trimmed)
          continue;
        const abiParameter = parseAbiParameter(trimmed, {
          type: "struct"
        });
        components.push(abiParameter);
      }
      if (!components.length)
        throw new InvalidStructSignatureError({ signature });
      shallowStructs[match.name] = components;
    }
    const resolvedStructs = {};
    const entries = Object.entries(shallowStructs);
    const entriesLength = entries.length;
    for (let i = 0; i < entriesLength; i++) {
      const [name, parameters] = entries[i];
      resolvedStructs[name] = resolveStructs(parameters, shallowStructs);
    }
    return resolvedStructs;
  }
  function resolveStructs(abiParameters = [], structs = {}, ancestors = /* @__PURE__ */ new Set()) {
    const components = [];
    const length = abiParameters.length;
    for (let i = 0; i < length; i++) {
      const abiParameter = abiParameters[i];
      const isTuple = isTupleRegex.test(abiParameter.type);
      if (isTuple)
        components.push(abiParameter);
      else {
        const match = execTyped(typeWithoutTupleRegex, abiParameter.type);
        if (!match?.type)
          throw new InvalidAbiTypeParameterError({ abiParameter });
        const { array, type } = match;
        if (type in structs) {
          if (ancestors.has(type))
            throw new CircularReferenceError({ type });
          components.push({
            ...abiParameter,
            type: `tuple${array ?? ""}`,
            components: resolveStructs(structs[type], structs, /* @__PURE__ */ new Set([...ancestors, type]))
          });
        } else {
          if (isSolidityType(type))
            components.push(abiParameter);
          else
            throw new UnknownTypeError({ type });
        }
      }
    }
    return components;
  }
  var typeWithoutTupleRegex;
  var init_structs = __esm({
    "node_modules/abitype/dist/esm/human-readable/runtime/structs.js"() {
      init_regex();
      init_abiItem();
      init_abiParameter();
      init_signature();
      init_struct();
      init_signatures();
      init_utils();
      typeWithoutTupleRegex = /^(?<type>[a-zA-Z$_][a-zA-Z0-9$_]*)(?<array>(?:\[\d*?\])+?)?$/;
    }
  });

  // node_modules/abitype/dist/esm/human-readable/parseAbi.js
  function parseAbi(signatures) {
    const structs = parseStructs(signatures);
    const abi = [];
    const length = signatures.length;
    for (let i = 0; i < length; i++) {
      const signature = signatures[i];
      if (isStructSignature(signature))
        continue;
      abi.push(parseSignature(signature, structs));
    }
    return abi;
  }
  var init_parseAbi = __esm({
    "node_modules/abitype/dist/esm/human-readable/parseAbi.js"() {
      init_signatures();
      init_structs();
      init_utils();
    }
  });

  // node_modules/abitype/dist/esm/exports/index.js
  var init_exports = __esm({
    "node_modules/abitype/dist/esm/exports/index.js"() {
      init_formatAbiItem();
      init_parseAbi();
    }
  });

  // node_modules/viem/_esm/utils/abi/formatAbiItem.js
  function formatAbiItem2(abiItem, { includeName = false } = {}) {
    if (abiItem.type !== "function" && abiItem.type !== "event" && abiItem.type !== "error")
      throw new InvalidDefinitionTypeError(abiItem.type);
    return `${abiItem.name}(${formatAbiParams(abiItem.inputs, { includeName })})`;
  }
  function formatAbiParams(params, { includeName = false } = {}) {
    if (!params)
      return "";
    return params.map((param) => formatAbiParam(param, { includeName })).join(includeName ? ", " : ",");
  }
  function formatAbiParam(param, { includeName }) {
    if (param.type.startsWith("tuple")) {
      return `(${formatAbiParams(param.components, { includeName })})${param.type.slice("tuple".length)}`;
    }
    return param.type + (includeName && param.name ? ` ${param.name}` : "");
  }
  var init_formatAbiItem2 = __esm({
    "node_modules/viem/_esm/utils/abi/formatAbiItem.js"() {
      init_abi();
    }
  });

  // node_modules/viem/_esm/utils/data/isHex.js
  function isHex(value, { even = false, strict = true } = {}) {
    if (!value)
      return false;
    if (typeof value !== "string")
      return false;
    if (even && value.length % 2 !== 0)
      return false;
    return strict ? /^0x[0-9a-fA-F]*$/.test(value) : value.startsWith("0x");
  }
  var init_isHex = __esm({
    "node_modules/viem/_esm/utils/data/isHex.js"() {
    }
  });

  // node_modules/viem/_esm/utils/data/size.js
  function size(value) {
    if (isHex(value, { strict: false }))
      return Math.ceil((value.length - 2) / 2);
    return value.length;
  }
  var init_size = __esm({
    "node_modules/viem/_esm/utils/data/size.js"() {
      init_isHex();
    }
  });

  // node_modules/viem/_esm/errors/version.js
  var version2;
  var init_version2 = __esm({
    "node_modules/viem/_esm/errors/version.js"() {
      version2 = "2.57.13";
    }
  });

  // node_modules/viem/_esm/errors/base.js
  function walk(err, fn) {
    if (fn?.(err))
      return err;
    if (err && typeof err === "object" && "cause" in err && err.cause !== void 0)
      return walk(err.cause, fn);
    return fn ? null : err;
  }
  var errorConfig, BaseError2;
  var init_base = __esm({
    "node_modules/viem/_esm/errors/base.js"() {
      init_version2();
      errorConfig = {
        getDocsUrl: ({ docsBaseUrl, docsPath = "", docsSlug }) => docsPath ? `${docsBaseUrl ?? "https://viem.sh"}${docsPath}${docsSlug ? `#${docsSlug}` : ""}` : void 0,
        version: `viem@${version2}`
      };
      BaseError2 = class _BaseError extends Error {
        constructor(shortMessage, args = {}) {
          const details = (() => {
            if (args.cause instanceof _BaseError)
              return args.cause.details;
            if (args.cause?.message)
              return args.cause.message;
            return args.details;
          })();
          const docsPath = (() => {
            if (args.cause instanceof _BaseError)
              return args.cause.docsPath || args.docsPath;
            return args.docsPath;
          })();
          const docsUrl = errorConfig.getDocsUrl?.({ ...args, docsPath });
          const message = [
            shortMessage || "An error occurred.",
            "",
            ...args.metaMessages ? [...args.metaMessages, ""] : [],
            ...docsUrl ? [`Docs: ${docsUrl}`] : [],
            ...details ? [`Details: ${details}`] : [],
            ...errorConfig.version ? [`Version: ${errorConfig.version}`] : []
          ].join("\n");
          super(message, args.cause ? { cause: args.cause } : void 0);
          Object.defineProperty(this, "details", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
          });
          Object.defineProperty(this, "docsPath", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
          });
          Object.defineProperty(this, "metaMessages", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
          });
          Object.defineProperty(this, "shortMessage", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
          });
          Object.defineProperty(this, "version", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
          });
          Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "BaseError"
          });
          this.details = details;
          this.docsPath = docsPath;
          this.metaMessages = args.metaMessages;
          this.name = args.name ?? this.name;
          this.shortMessage = shortMessage;
          this.version = version2;
        }
        walk(fn) {
          return walk(this, fn);
        }
      };
    }
  });

  // node_modules/viem/_esm/errors/abi.js
  var AbiDecodingDataSizeTooSmallError, AbiDecodingZeroDataError, AbiEncodingArrayLengthMismatchError, AbiEncodingBytesSizeMismatchError, AbiEncodingLengthMismatchError, AbiFunctionSignatureNotFoundError, BytesSizeMismatchError, InvalidAbiEncodingTypeError, InvalidAbiDecodingTypeError, InvalidArrayError, InvalidDefinitionTypeError;
  var init_abi = __esm({
    "node_modules/viem/_esm/errors/abi.js"() {
      init_formatAbiItem2();
      init_size();
      init_base();
      AbiDecodingDataSizeTooSmallError = class extends BaseError2 {
        constructor({ data, params, size: size2 }) {
          super([`Data size of ${size2} bytes is too small for given parameters.`].join("\n"), {
            metaMessages: [
              `Params: (${formatAbiParams(params, { includeName: true })})`,
              `Data:   ${data} (${size2} bytes)`
            ],
            name: "AbiDecodingDataSizeTooSmallError"
          });
          Object.defineProperty(this, "data", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
          });
          Object.defineProperty(this, "params", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
          });
          Object.defineProperty(this, "size", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
          });
          this.data = data;
          this.params = params;
          this.size = size2;
        }
      };
      AbiDecodingZeroDataError = class extends BaseError2 {
        constructor({ cause } = {}) {
          super('Cannot decode zero data ("0x") with ABI parameters.', {
            name: "AbiDecodingZeroDataError",
            cause
          });
        }
      };
      AbiEncodingArrayLengthMismatchError = class extends BaseError2 {
        constructor({ expectedLength, givenLength, type }) {
          super([
            `ABI encoding array length mismatch for type ${type}.`,
            `Expected length: ${expectedLength}`,
            `Given length: ${givenLength}`
          ].join("\n"), { name: "AbiEncodingArrayLengthMismatchError" });
        }
      };
      AbiEncodingBytesSizeMismatchError = class extends BaseError2 {
        constructor({ expectedSize, value }) {
          super(`Size of bytes "${value}" (bytes${size(value)}) does not match expected size (bytes${expectedSize}).`, { name: "AbiEncodingBytesSizeMismatchError" });
        }
      };
      AbiEncodingLengthMismatchError = class extends BaseError2 {
        constructor({ expectedLength, givenLength }) {
          super([
            "ABI encoding params/values length mismatch.",
            `Expected length (params): ${expectedLength}`,
            `Given length (values): ${givenLength}`
          ].join("\n"), { name: "AbiEncodingLengthMismatchError" });
        }
      };
      AbiFunctionSignatureNotFoundError = class extends BaseError2 {
        constructor(signature, { docsPath }) {
          super([
            `Encoded function signature "${signature}" not found on ABI.`,
            "Make sure you are using the correct ABI and that the function exists on it.",
            `You can look up the signature here: https://4byte.sourcify.dev/?q=${signature}.`
          ].join("\n"), {
            docsPath,
            name: "AbiFunctionSignatureNotFoundError"
          });
        }
      };
      BytesSizeMismatchError = class extends BaseError2 {
        constructor({ expectedSize, givenSize }) {
          super(`Expected bytes${expectedSize}, got bytes${givenSize}.`, {
            name: "BytesSizeMismatchError"
          });
        }
      };
      InvalidAbiEncodingTypeError = class extends BaseError2 {
        constructor(type, { docsPath }) {
          super([
            `Type "${type}" is not a valid encoding type.`,
            "Please provide a valid ABI type."
          ].join("\n"), { docsPath, name: "InvalidAbiEncodingType" });
        }
      };
      InvalidAbiDecodingTypeError = class extends BaseError2 {
        constructor(type, { docsPath }) {
          super([
            `Type "${type}" is not a valid decoding type.`,
            "Please provide a valid ABI type."
          ].join("\n"), { docsPath, name: "InvalidAbiDecodingType" });
        }
      };
      InvalidArrayError = class extends BaseError2 {
        constructor(value) {
          super([`Value "${value}" is not a valid array.`].join("\n"), {
            name: "InvalidArrayError"
          });
        }
      };
      InvalidDefinitionTypeError = class extends BaseError2 {
        constructor(type) {
          super([
            `"${type}" is not a valid definition type.`,
            'Valid types: "function", "event", "error"'
          ].join("\n"), { name: "InvalidDefinitionTypeError" });
        }
      };
    }
  });

  // node_modules/viem/_esm/errors/data.js
  var SliceOffsetOutOfBoundsError, SizeExceedsPaddingSizeError;
  var init_data = __esm({
    "node_modules/viem/_esm/errors/data.js"() {
      init_base();
      SliceOffsetOutOfBoundsError = class extends BaseError2 {
        constructor({ offset, position, size: size2 }) {
          super(`Slice ${position === "start" ? "starting" : "ending"} at offset "${offset}" is out-of-bounds (size: ${size2}).`, { name: "SliceOffsetOutOfBoundsError" });
        }
      };
      SizeExceedsPaddingSizeError = class extends BaseError2 {
        constructor({ size: size2, targetSize, type }) {
          super(`${type.charAt(0).toUpperCase()}${type.slice(1).toLowerCase()} size (${size2}) exceeds padding size (${targetSize}).`, { name: "SizeExceedsPaddingSizeError" });
        }
      };
    }
  });

  // node_modules/viem/_esm/utils/data/pad.js
  function pad(hexOrBytes, { dir, size: size2 = 32 } = {}) {
    if (typeof hexOrBytes === "string")
      return padHex(hexOrBytes, { dir, size: size2 });
    return padBytes(hexOrBytes, { dir, size: size2 });
  }
  function padHex(hex_, { dir, size: size2 = 32 } = {}) {
    if (size2 === null)
      return hex_;
    const hex = hex_.replace("0x", "");
    if (hex.length > size2 * 2)
      throw new SizeExceedsPaddingSizeError({
        size: Math.ceil(hex.length / 2),
        targetSize: size2,
        type: "hex"
      });
    return `0x${hex[dir === "right" ? "padEnd" : "padStart"](size2 * 2, "0")}`;
  }
  function padBytes(bytes, { dir, size: size2 = 32 } = {}) {
    if (size2 === null)
      return bytes;
    if (bytes.length > size2)
      throw new SizeExceedsPaddingSizeError({
        size: bytes.length,
        targetSize: size2,
        type: "bytes"
      });
    const paddedBytes = new Uint8Array(size2);
    for (let i = 0; i < size2; i++) {
      const padEnd = dir === "right";
      paddedBytes[padEnd ? i : size2 - i - 1] = bytes[padEnd ? i : bytes.length - i - 1];
    }
    return paddedBytes;
  }
  var init_pad = __esm({
    "node_modules/viem/_esm/utils/data/pad.js"() {
      init_data();
    }
  });

  // node_modules/viem/_esm/errors/encoding.js
  var IntegerOutOfRangeError, InvalidBytesBooleanError, SizeOverflowError;
  var init_encoding = __esm({
    "node_modules/viem/_esm/errors/encoding.js"() {
      init_base();
      IntegerOutOfRangeError = class extends BaseError2 {
        constructor({ max, min, signed, size: size2, value }) {
          super(`Number "${value}" is not in safe ${size2 ? `${size2 * 8}-bit ${signed ? "signed" : "unsigned"} ` : ""}integer range ${max ? `(${min} to ${max})` : `(above ${min})`}`, { name: "IntegerOutOfRangeError" });
        }
      };
      InvalidBytesBooleanError = class extends BaseError2 {
        constructor(bytes) {
          super(`Bytes value "${bytes}" is not a valid boolean. The bytes array must contain a single byte of either a 0 or 1 value.`, {
            name: "InvalidBytesBooleanError"
          });
        }
      };
      SizeOverflowError = class extends BaseError2 {
        constructor({ givenSize, maxSize }) {
          super(`Size cannot exceed ${maxSize} bytes. Given size: ${givenSize} bytes.`, { name: "SizeOverflowError" });
        }
      };
    }
  });

  // node_modules/viem/_esm/utils/data/trim.js
  function trim(hexOrBytes, { dir = "left" } = {}) {
    let data = typeof hexOrBytes === "string" ? hexOrBytes.replace("0x", "") : hexOrBytes;
    let sliceLength = 0;
    for (let i = 0; i < data.length - 1; i++) {
      if (data[dir === "left" ? i : data.length - i - 1].toString() === "0")
        sliceLength++;
      else
        break;
    }
    data = dir === "left" ? data.slice(sliceLength) : data.slice(0, data.length - sliceLength);
    if (typeof hexOrBytes === "string") {
      if (data.length === 1 && dir === "right")
        data = `${data}0`;
      return `0x${data.length % 2 === 1 ? `0${data}` : data}`;
    }
    return data;
  }
  var init_trim = __esm({
    "node_modules/viem/_esm/utils/data/trim.js"() {
    }
  });

  // node_modules/viem/_esm/utils/encoding/fromHex.js
  function assertSize(hexOrBytes, { size: size2 }) {
    if (size(hexOrBytes) > size2)
      throw new SizeOverflowError({
        givenSize: size(hexOrBytes),
        maxSize: size2
      });
  }
  function hexToBigInt(hex, opts = {}) {
    const { signed } = opts;
    if (opts.size)
      assertSize(hex, { size: opts.size });
    const value = BigInt(hex);
    if (!signed)
      return value;
    const size2 = Math.ceil((hex.length - 2) / 2);
    const max = (1n << BigInt(size2) * 8n - 1n) - 1n;
    if (value <= max)
      return value;
    return value - BigInt(`0x${"f".padStart(size2 * 2, "f")}`) - 1n;
  }
  function hexToNumber(hex, opts = {}) {
    const value = hexToBigInt(hex, opts);
    const number = Number(value);
    if (!Number.isSafeInteger(number))
      throw new IntegerOutOfRangeError({
        max: `${Number.MAX_SAFE_INTEGER}`,
        min: `${Number.MIN_SAFE_INTEGER}`,
        signed: opts.signed,
        size: opts.size,
        value: `${value}n`
      });
    return number;
  }
  var init_fromHex = __esm({
    "node_modules/viem/_esm/utils/encoding/fromHex.js"() {
      init_encoding();
      init_size();
    }
  });

  // node_modules/viem/_esm/utils/encoding/toHex.js
  function toHex(value, opts = {}) {
    if (typeof value === "number" || typeof value === "bigint")
      return numberToHex(value, opts);
    if (typeof value === "string") {
      return stringToHex(value, opts);
    }
    if (typeof value === "boolean")
      return boolToHex(value, opts);
    return bytesToHex(value, opts);
  }
  function boolToHex(value, opts = {}) {
    const hex = `0x${Number(value)}`;
    if (typeof opts.size === "number") {
      assertSize(hex, { size: opts.size });
      return pad(hex, { size: opts.size });
    }
    return hex;
  }
  function bytesToHex(value, opts = {}) {
    let string = "";
    for (let i = 0; i < value.length; i++) {
      string += hexes[value[i]];
    }
    const hex = `0x${string}`;
    if (typeof opts.size === "number") {
      assertSize(hex, { size: opts.size });
      return pad(hex, { dir: "right", size: opts.size });
    }
    return hex;
  }
  function numberToHex(value_, opts = {}) {
    const { signed, size: size2 } = opts;
    const value = BigInt(value_);
    let maxValue;
    if (size2) {
      if (signed)
        maxValue = (1n << BigInt(size2) * 8n - 1n) - 1n;
      else
        maxValue = 2n ** (BigInt(size2) * 8n) - 1n;
    } else if (typeof value_ === "number") {
      maxValue = BigInt(Number.MAX_SAFE_INTEGER);
    }
    const minValue = typeof maxValue === "bigint" && signed ? -maxValue - 1n : 0;
    if (maxValue && value > maxValue || value < minValue) {
      const suffix = typeof value_ === "bigint" ? "n" : "";
      throw new IntegerOutOfRangeError({
        max: maxValue ? `${maxValue}${suffix}` : void 0,
        min: `${minValue}${suffix}`,
        signed,
        size: size2,
        value: `${value_}${suffix}`
      });
    }
    const hex = `0x${(signed && value < 0 ? (1n << BigInt(size2 * 8)) + BigInt(value) : value).toString(16)}`;
    if (size2)
      return pad(hex, { size: size2 });
    return hex;
  }
  function stringToHex(value_, opts = {}) {
    const value = encoder.encode(value_);
    return bytesToHex(value, opts);
  }
  var hexes, encoder;
  var init_toHex = __esm({
    "node_modules/viem/_esm/utils/encoding/toHex.js"() {
      init_encoding();
      init_pad();
      init_fromHex();
      hexes = /* @__PURE__ */ Array.from({ length: 256 }, (_v, i) => i.toString(16).padStart(2, "0"));
      encoder = /* @__PURE__ */ new TextEncoder();
    }
  });

  // node_modules/viem/_esm/utils/encoding/toBytes.js
  function toBytes(value, opts = {}) {
    if (typeof value === "number" || typeof value === "bigint")
      return numberToBytes(value, opts);
    if (typeof value === "boolean")
      return boolToBytes(value, opts);
    if (isHex(value))
      return hexToBytes(value, opts);
    return stringToBytes(value, opts);
  }
  function boolToBytes(value, opts = {}) {
    const bytes = new Uint8Array(1);
    bytes[0] = Number(value);
    if (typeof opts.size === "number") {
      assertSize(bytes, { size: opts.size });
      return pad(bytes, { size: opts.size });
    }
    return bytes;
  }
  function charCodeToBase16(char) {
    if (char >= charCodeMap.zero && char <= charCodeMap.nine)
      return char - charCodeMap.zero;
    if (char >= charCodeMap.A && char <= charCodeMap.F)
      return char - (charCodeMap.A - 10);
    if (char >= charCodeMap.a && char <= charCodeMap.f)
      return char - (charCodeMap.a - 10);
    return void 0;
  }
  function hexToBytes(hex_, opts = {}) {
    let hex = hex_;
    if (opts.size) {
      assertSize(hex, { size: opts.size });
      hex = pad(hex, { dir: "right", size: opts.size });
    }
    let hexString = hex.slice(2);
    if (hexString.length % 2)
      hexString = `0${hexString}`;
    const length = hexString.length / 2;
    const bytes = new Uint8Array(length);
    for (let index = 0, j = 0; index < length; index++) {
      const nibbleLeft = charCodeToBase16(hexString.charCodeAt(j++));
      const nibbleRight = charCodeToBase16(hexString.charCodeAt(j++));
      if (nibbleLeft === void 0 || nibbleRight === void 0) {
        throw new BaseError2(`Invalid byte sequence ("${hexString[j - 2]}${hexString[j - 1]}" in "${hexString}").`);
      }
      bytes[index] = nibbleLeft * 16 + nibbleRight;
    }
    return bytes;
  }
  function numberToBytes(value, opts) {
    const hex = numberToHex(value, opts);
    return hexToBytes(hex);
  }
  function stringToBytes(value, opts = {}) {
    const bytes = encoder2.encode(value);
    if (typeof opts.size === "number") {
      assertSize(bytes, { size: opts.size });
      return pad(bytes, { dir: "right", size: opts.size });
    }
    return bytes;
  }
  var encoder2, charCodeMap;
  var init_toBytes = __esm({
    "node_modules/viem/_esm/utils/encoding/toBytes.js"() {
      init_base();
      init_isHex();
      init_pad();
      init_fromHex();
      init_toHex();
      encoder2 = /* @__PURE__ */ new TextEncoder();
      charCodeMap = {
        zero: 48,
        nine: 57,
        A: 65,
        F: 70,
        a: 97,
        f: 102
      };
    }
  });

  // node_modules/@noble/hashes/esm/_u64.js
  function fromBig(n, le = false) {
    if (le)
      return { h: Number(n & U32_MASK64), l: Number(n >> _32n & U32_MASK64) };
    return { h: Number(n >> _32n & U32_MASK64) | 0, l: Number(n & U32_MASK64) | 0 };
  }
  function split(lst, le = false) {
    const len = lst.length;
    let Ah = new Uint32Array(len);
    let Al = new Uint32Array(len);
    for (let i = 0; i < len; i++) {
      const { h, l } = fromBig(lst[i], le);
      [Ah[i], Al[i]] = [h, l];
    }
    return [Ah, Al];
  }
  var U32_MASK64, _32n, rotlSH, rotlSL, rotlBH, rotlBL;
  var init_u64 = __esm({
    "node_modules/@noble/hashes/esm/_u64.js"() {
      U32_MASK64 = /* @__PURE__ */ BigInt(2 ** 32 - 1);
      _32n = /* @__PURE__ */ BigInt(32);
      rotlSH = (h, l, s) => h << s | l >>> 32 - s;
      rotlSL = (h, l, s) => l << s | h >>> 32 - s;
      rotlBH = (h, l, s) => l << s - 32 | h >>> 64 - s;
      rotlBL = (h, l, s) => h << s - 32 | l >>> 64 - s;
    }
  });

  // node_modules/@noble/hashes/esm/utils.js
  function isBytes(a) {
    return a instanceof Uint8Array || ArrayBuffer.isView(a) && a.constructor.name === "Uint8Array";
  }
  function anumber(n) {
    if (!Number.isSafeInteger(n) || n < 0)
      throw new Error("positive integer expected, got " + n);
  }
  function abytes(b, ...lengths) {
    if (!isBytes(b))
      throw new Error("Uint8Array expected");
    if (lengths.length > 0 && !lengths.includes(b.length))
      throw new Error("Uint8Array expected of length " + lengths + ", got length=" + b.length);
  }
  function aexists(instance, checkFinished = true) {
    if (instance.destroyed)
      throw new Error("Hash instance has been destroyed");
    if (checkFinished && instance.finished)
      throw new Error("Hash#digest() has already been called");
  }
  function aoutput(out, instance) {
    abytes(out);
    const min = instance.outputLen;
    if (out.length < min) {
      throw new Error("digestInto() expects output buffer of length at least " + min);
    }
  }
  function u32(arr) {
    return new Uint32Array(arr.buffer, arr.byteOffset, Math.floor(arr.byteLength / 4));
  }
  function clean(...arrays) {
    for (let i = 0; i < arrays.length; i++) {
      arrays[i].fill(0);
    }
  }
  function byteSwap(word) {
    return word << 24 & 4278190080 | word << 8 & 16711680 | word >>> 8 & 65280 | word >>> 24 & 255;
  }
  function byteSwap32(arr) {
    for (let i = 0; i < arr.length; i++) {
      arr[i] = byteSwap(arr[i]);
    }
    return arr;
  }
  function utf8ToBytes(str) {
    if (typeof str !== "string")
      throw new Error("string expected");
    return new Uint8Array(new TextEncoder().encode(str));
  }
  function toBytes2(data) {
    if (typeof data === "string")
      data = utf8ToBytes(data);
    abytes(data);
    return data;
  }
  function createHasher(hashCons) {
    const hashC = (msg) => hashCons().update(toBytes2(msg)).digest();
    const tmp = hashCons();
    hashC.outputLen = tmp.outputLen;
    hashC.blockLen = tmp.blockLen;
    hashC.create = () => hashCons();
    return hashC;
  }
  var isLE, swap32IfBE, Hash;
  var init_utils2 = __esm({
    "node_modules/@noble/hashes/esm/utils.js"() {
      isLE = /* @__PURE__ */ (() => new Uint8Array(new Uint32Array([287454020]).buffer)[0] === 68)();
      swap32IfBE = isLE ? (u) => u : byteSwap32;
      Hash = class {
      };
    }
  });

  // node_modules/@noble/hashes/esm/sha3.js
  function keccakP(s, rounds = 24) {
    const B = new Uint32Array(5 * 2);
    for (let round = 24 - rounds; round < 24; round++) {
      for (let x = 0; x < 10; x++)
        B[x] = s[x] ^ s[x + 10] ^ s[x + 20] ^ s[x + 30] ^ s[x + 40];
      for (let x = 0; x < 10; x += 2) {
        const idx1 = (x + 8) % 10;
        const idx0 = (x + 2) % 10;
        const B0 = B[idx0];
        const B1 = B[idx0 + 1];
        const Th = rotlH(B0, B1, 1) ^ B[idx1];
        const Tl = rotlL(B0, B1, 1) ^ B[idx1 + 1];
        for (let y = 0; y < 50; y += 10) {
          s[x + y] ^= Th;
          s[x + y + 1] ^= Tl;
        }
      }
      let curH = s[2];
      let curL = s[3];
      for (let t = 0; t < 24; t++) {
        const shift = SHA3_ROTL[t];
        const Th = rotlH(curH, curL, shift);
        const Tl = rotlL(curH, curL, shift);
        const PI = SHA3_PI[t];
        curH = s[PI];
        curL = s[PI + 1];
        s[PI] = Th;
        s[PI + 1] = Tl;
      }
      for (let y = 0; y < 50; y += 10) {
        for (let x = 0; x < 10; x++)
          B[x] = s[y + x];
        for (let x = 0; x < 10; x++)
          s[y + x] ^= ~B[(x + 2) % 10] & B[(x + 4) % 10];
      }
      s[0] ^= SHA3_IOTA_H[round];
      s[1] ^= SHA3_IOTA_L[round];
    }
    clean(B);
  }
  var _0n, _1n, _2n, _7n, _256n, _0x71n, SHA3_PI, SHA3_ROTL, _SHA3_IOTA, IOTAS, SHA3_IOTA_H, SHA3_IOTA_L, rotlH, rotlL, Keccak, gen, keccak_256;
  var init_sha3 = __esm({
    "node_modules/@noble/hashes/esm/sha3.js"() {
      init_u64();
      init_utils2();
      _0n = BigInt(0);
      _1n = BigInt(1);
      _2n = BigInt(2);
      _7n = BigInt(7);
      _256n = BigInt(256);
      _0x71n = BigInt(113);
      SHA3_PI = [];
      SHA3_ROTL = [];
      _SHA3_IOTA = [];
      for (let round = 0, R = _1n, x = 1, y = 0; round < 24; round++) {
        [x, y] = [y, (2 * x + 3 * y) % 5];
        SHA3_PI.push(2 * (5 * y + x));
        SHA3_ROTL.push((round + 1) * (round + 2) / 2 % 64);
        let t = _0n;
        for (let j = 0; j < 7; j++) {
          R = (R << _1n ^ (R >> _7n) * _0x71n) % _256n;
          if (R & _2n)
            t ^= _1n << (_1n << /* @__PURE__ */ BigInt(j)) - _1n;
        }
        _SHA3_IOTA.push(t);
      }
      IOTAS = split(_SHA3_IOTA, true);
      SHA3_IOTA_H = IOTAS[0];
      SHA3_IOTA_L = IOTAS[1];
      rotlH = (h, l, s) => s > 32 ? rotlBH(h, l, s) : rotlSH(h, l, s);
      rotlL = (h, l, s) => s > 32 ? rotlBL(h, l, s) : rotlSL(h, l, s);
      Keccak = class _Keccak extends Hash {
        // NOTE: we accept arguments in bytes instead of bits here.
        constructor(blockLen, suffix, outputLen, enableXOF = false, rounds = 24) {
          super();
          this.pos = 0;
          this.posOut = 0;
          this.finished = false;
          this.destroyed = false;
          this.enableXOF = false;
          this.blockLen = blockLen;
          this.suffix = suffix;
          this.outputLen = outputLen;
          this.enableXOF = enableXOF;
          this.rounds = rounds;
          anumber(outputLen);
          if (!(0 < blockLen && blockLen < 200))
            throw new Error("only keccak-f1600 function is supported");
          this.state = new Uint8Array(200);
          this.state32 = u32(this.state);
        }
        clone() {
          return this._cloneInto();
        }
        keccak() {
          swap32IfBE(this.state32);
          keccakP(this.state32, this.rounds);
          swap32IfBE(this.state32);
          this.posOut = 0;
          this.pos = 0;
        }
        update(data) {
          aexists(this);
          data = toBytes2(data);
          abytes(data);
          const { blockLen, state } = this;
          const len = data.length;
          for (let pos = 0; pos < len; ) {
            const take = Math.min(blockLen - this.pos, len - pos);
            for (let i = 0; i < take; i++)
              state[this.pos++] ^= data[pos++];
            if (this.pos === blockLen)
              this.keccak();
          }
          return this;
        }
        finish() {
          if (this.finished)
            return;
          this.finished = true;
          const { state, suffix, pos, blockLen } = this;
          state[pos] ^= suffix;
          if ((suffix & 128) !== 0 && pos === blockLen - 1)
            this.keccak();
          state[blockLen - 1] ^= 128;
          this.keccak();
        }
        writeInto(out) {
          aexists(this, false);
          abytes(out);
          this.finish();
          const bufferOut = this.state;
          const { blockLen } = this;
          for (let pos = 0, len = out.length; pos < len; ) {
            if (this.posOut >= blockLen)
              this.keccak();
            const take = Math.min(blockLen - this.posOut, len - pos);
            out.set(bufferOut.subarray(this.posOut, this.posOut + take), pos);
            this.posOut += take;
            pos += take;
          }
          return out;
        }
        xofInto(out) {
          if (!this.enableXOF)
            throw new Error("XOF is not possible for this instance");
          return this.writeInto(out);
        }
        xof(bytes) {
          anumber(bytes);
          return this.xofInto(new Uint8Array(bytes));
        }
        digestInto(out) {
          aoutput(out, this);
          if (this.finished)
            throw new Error("digest() was already called");
          this.writeInto(out);
          this.destroy();
          return out;
        }
        digest() {
          return this.digestInto(new Uint8Array(this.outputLen));
        }
        destroy() {
          this.destroyed = true;
          clean(this.state);
        }
        _cloneInto(to) {
          const { blockLen, suffix, outputLen, rounds, enableXOF } = this;
          to || (to = new _Keccak(blockLen, suffix, outputLen, enableXOF, rounds));
          to.state32.set(this.state32);
          to.pos = this.pos;
          to.posOut = this.posOut;
          to.finished = this.finished;
          to.rounds = rounds;
          to.suffix = suffix;
          to.outputLen = outputLen;
          to.enableXOF = enableXOF;
          to.destroyed = this.destroyed;
          return to;
        }
      };
      gen = (suffix, blockLen, outputLen) => createHasher(() => new Keccak(blockLen, suffix, outputLen));
      keccak_256 = /* @__PURE__ */ (() => gen(1, 136, 256 / 8))();
    }
  });

  // node_modules/viem/_esm/utils/hash/keccak256.js
  function keccak256(value, to_) {
    const to = to_ || "hex";
    const bytes = keccak_256(isHex(value, { strict: false }) ? toBytes(value) : value);
    if (to === "bytes")
      return bytes;
    return toHex(bytes);
  }
  var init_keccak256 = __esm({
    "node_modules/viem/_esm/utils/hash/keccak256.js"() {
      init_sha3();
      init_isHex();
      init_toBytes();
      init_toHex();
    }
  });

  // node_modules/viem/_esm/utils/hash/hashSignature.js
  function hashSignature(sig) {
    return hash(sig);
  }
  var hash;
  var init_hashSignature = __esm({
    "node_modules/viem/_esm/utils/hash/hashSignature.js"() {
      init_toBytes();
      init_keccak256();
      hash = (value) => keccak256(toBytes(value));
    }
  });

  // node_modules/viem/_esm/utils/hash/normalizeSignature.js
  function normalizeSignature(signature) {
    let active = true;
    let current = "";
    let level = 0;
    let result2 = "";
    let valid = false;
    for (let i = 0; i < signature.length; i++) {
      const char = signature[i];
      if (["(", ")", ","].includes(char))
        active = true;
      if (char === "(")
        level++;
      if (char === ")")
        level--;
      if (!active)
        continue;
      if (level === 0) {
        if (char === " " && ["event", "function", "error", ""].includes(result2))
          result2 = "";
        else {
          result2 += char;
          if (char === ")") {
            valid = true;
            break;
          }
        }
        continue;
      }
      if (char === " ") {
        if (!current.endsWith(",") && !current.endsWith("(")) {
          current = "";
          active = false;
        }
        continue;
      }
      result2 += char;
      current += char;
    }
    if (!valid)
      throw new BaseError2("Unable to normalize signature.");
    return result2;
  }
  var init_normalizeSignature = __esm({
    "node_modules/viem/_esm/utils/hash/normalizeSignature.js"() {
      init_base();
    }
  });

  // node_modules/viem/_esm/utils/hash/toSignature.js
  var toSignature;
  var init_toSignature = __esm({
    "node_modules/viem/_esm/utils/hash/toSignature.js"() {
      init_exports();
      init_normalizeSignature();
      toSignature = (def) => {
        const def_ = (() => {
          if (typeof def === "string")
            return def;
          return formatAbiItem(def);
        })();
        return normalizeSignature(def_);
      };
    }
  });

  // node_modules/viem/_esm/utils/hash/toSignatureHash.js
  function toSignatureHash(fn) {
    return hashSignature(toSignature(fn));
  }
  var init_toSignatureHash = __esm({
    "node_modules/viem/_esm/utils/hash/toSignatureHash.js"() {
      init_hashSignature();
      init_toSignature();
    }
  });

  // node_modules/viem/_esm/errors/address.js
  var InvalidAddressError;
  var init_address = __esm({
    "node_modules/viem/_esm/errors/address.js"() {
      init_base();
      InvalidAddressError = class extends BaseError2 {
        constructor({ address }) {
          super(`Address "${address}" is invalid.`, {
            metaMessages: [
              "- Address must be a hex value of 20 bytes (40 hex characters).",
              "- Address must match its checksum counterpart."
            ],
            name: "InvalidAddressError"
          });
        }
      };
    }
  });

  // node_modules/viem/_esm/utils/lru.js
  var LruMap;
  var init_lru = __esm({
    "node_modules/viem/_esm/utils/lru.js"() {
      LruMap = class extends Map {
        constructor(size2) {
          super();
          Object.defineProperty(this, "maxSize", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
          });
          this.maxSize = size2;
        }
        get(key) {
          const value = super.get(key);
          if (super.has(key)) {
            super.delete(key);
            super.set(key, value);
          }
          return value;
        }
        set(key, value) {
          if (super.has(key))
            super.delete(key);
          super.set(key, value);
          if (this.maxSize && this.size > this.maxSize) {
            const firstKey = super.keys().next().value;
            if (firstKey !== void 0)
              super.delete(firstKey);
          }
          return this;
        }
      };
    }
  });

  // node_modules/viem/_esm/utils/address/getAddress.js
  function checksumAddress(address_, chainId) {
    if (checksumAddressCache.has(`${address_}.${chainId}`))
      return checksumAddressCache.get(`${address_}.${chainId}`);
    const hexAddress = chainId ? `${chainId}${address_.toLowerCase()}` : address_.substring(2).toLowerCase();
    const hash2 = keccak256(stringToBytes(hexAddress), "bytes");
    const address = (chainId ? hexAddress.substring(`${chainId}0x`.length) : hexAddress).split("");
    for (let i = 0; i < 40; i += 2) {
      if (hash2[i >> 1] >> 4 >= 8 && address[i]) {
        address[i] = address[i].toUpperCase();
      }
      if ((hash2[i >> 1] & 15) >= 8 && address[i + 1]) {
        address[i + 1] = address[i + 1].toUpperCase();
      }
    }
    const result2 = `0x${address.join("")}`;
    checksumAddressCache.set(`${address_}.${chainId}`, result2);
    return result2;
  }
  function getAddress(address, chainId) {
    if (!isAddress(address, { strict: false }))
      throw new InvalidAddressError({ address });
    return checksumAddress(address, chainId);
  }
  var checksumAddressCache;
  var init_getAddress = __esm({
    "node_modules/viem/_esm/utils/address/getAddress.js"() {
      init_address();
      init_toBytes();
      init_keccak256();
      init_lru();
      init_isAddress();
      checksumAddressCache = /* @__PURE__ */ new LruMap(8192);
    }
  });

  // node_modules/viem/_esm/utils/address/isAddress.js
  function isAddress(address, options) {
    const { strict = true } = options ?? {};
    const cacheKey = `${address}.${strict}`;
    if (isAddressCache.has(cacheKey))
      return isAddressCache.get(cacheKey);
    const result2 = (() => {
      if (!addressRegex.test(address))
        return false;
      if (address.toLowerCase() === address)
        return true;
      if (strict)
        return checksumAddress(address) === address;
      return true;
    })();
    isAddressCache.set(cacheKey, result2);
    return result2;
  }
  var addressRegex, isAddressCache;
  var init_isAddress = __esm({
    "node_modules/viem/_esm/utils/address/isAddress.js"() {
      init_lru();
      init_getAddress();
      addressRegex = /^0x[a-fA-F0-9]{40}$/;
      isAddressCache = /* @__PURE__ */ new LruMap(8192);
    }
  });

  // node_modules/viem/_esm/utils/data/concat.js
  function concat(values) {
    if (typeof values[0] === "string")
      return concatHex(values);
    return concatBytes(values);
  }
  function concatBytes(values) {
    let length = 0;
    for (const arr of values) {
      length += arr.length;
    }
    const result2 = new Uint8Array(length);
    let offset = 0;
    for (const arr of values) {
      result2.set(arr, offset);
      offset += arr.length;
    }
    return result2;
  }
  function concatHex(values) {
    return `0x${values.reduce((acc, x) => acc + x.replace("0x", ""), "")}`;
  }
  var init_concat = __esm({
    "node_modules/viem/_esm/utils/data/concat.js"() {
    }
  });

  // node_modules/viem/_esm/utils/data/slice.js
  function slice(value, start, end, { strict } = {}) {
    if (isHex(value, { strict: false }))
      return sliceHex(value, start, end, {
        strict
      });
    return sliceBytes(value, start, end, {
      strict
    });
  }
  function assertStartOffset(value, start) {
    if (typeof start === "number" && start > 0 && start > size(value) - 1)
      throw new SliceOffsetOutOfBoundsError({
        offset: start,
        position: "start",
        size: size(value)
      });
  }
  function assertEndOffset(value, start, end) {
    if (typeof start === "number" && typeof end === "number" && size(value) !== end - start) {
      throw new SliceOffsetOutOfBoundsError({
        offset: end,
        position: "end",
        size: size(value)
      });
    }
  }
  function sliceBytes(value_, start, end, { strict } = {}) {
    assertStartOffset(value_, start);
    const value = value_.slice(start, end);
    if (strict)
      assertEndOffset(value, start, end);
    return value;
  }
  function sliceHex(value_, start, end, { strict } = {}) {
    assertStartOffset(value_, start);
    const value = `0x${value_.replace("0x", "").slice((start ?? 0) * 2, (end ?? value_.length) * 2)}`;
    if (strict)
      assertEndOffset(value, start, end);
    return value;
  }
  var init_slice = __esm({
    "node_modules/viem/_esm/utils/data/slice.js"() {
      init_data();
      init_isHex();
      init_size();
    }
  });

  // node_modules/viem/_esm/utils/regex.js
  var bytesRegex2, integerRegex2;
  var init_regex2 = __esm({
    "node_modules/viem/_esm/utils/regex.js"() {
      bytesRegex2 = /^bytes([1-9]|1[0-9]|2[0-9]|3[0-2])?$/;
      integerRegex2 = /^(u?int)(8|16|24|32|40|48|56|64|72|80|88|96|104|112|120|128|136|144|152|160|168|176|184|192|200|208|216|224|232|240|248|256)?$/;
    }
  });

  // node_modules/viem/_esm/utils/abi/encodeAbiParameters.js
  function encodeAbiParameters(params, values) {
    if (params.length !== values.length)
      throw new AbiEncodingLengthMismatchError({
        expectedLength: params.length,
        givenLength: values.length
      });
    const preparedParams = prepareParams({
      params,
      values
    });
    return encodeParams(preparedParams);
  }
  function prepareParams({ params, values }) {
    const preparedParams = [];
    for (let i = 0; i < params.length; i++) {
      preparedParams.push(prepareParam({ param: params[i], value: values[i] }));
    }
    return preparedParams;
  }
  function prepareParam({ param, value }) {
    const arrayComponents = getArrayComponents(param.type);
    if (arrayComponents) {
      const [length, type] = arrayComponents;
      return encodeArray(value, { length, param: { ...param, type } });
    }
    if (param.type === "tuple") {
      return encodeTuple(value, {
        param
      });
    }
    if (param.type === "address") {
      return encodeAddress(value);
    }
    if (param.type === "bool") {
      return encodeBool(value);
    }
    if (param.type.startsWith("uint") || param.type.startsWith("int")) {
      const signed = param.type.startsWith("int");
      const [, , size2 = "256"] = integerRegex2.exec(param.type) ?? [];
      return encodeNumber(value, {
        signed,
        size: Number(size2)
      });
    }
    if (param.type.startsWith("bytes")) {
      return encodeBytes(value, { param });
    }
    if (param.type === "string") {
      return encodeString(value);
    }
    throw new InvalidAbiEncodingTypeError(param.type, {
      docsPath: "/docs/contract/encodeAbiParameters"
    });
  }
  function encodeParams(preparedParams) {
    let staticSize = 0;
    for (let i = 0; i < preparedParams.length; i++) {
      const { dynamic, encoded } = preparedParams[i];
      if (dynamic)
        staticSize += 32;
      else
        staticSize += size(encoded);
    }
    const staticParams = [];
    const dynamicParams = [];
    let dynamicSize = 0;
    for (let i = 0; i < preparedParams.length; i++) {
      const { dynamic, encoded } = preparedParams[i];
      if (dynamic) {
        staticParams.push(numberToHex(staticSize + dynamicSize, { size: 32 }));
        dynamicParams.push(encoded);
        dynamicSize += size(encoded);
      } else {
        staticParams.push(encoded);
      }
    }
    return concatHex([...staticParams, ...dynamicParams]);
  }
  function encodeAddress(value) {
    if (!isAddress(value))
      throw new InvalidAddressError({ address: value });
    return { dynamic: false, encoded: padHex(value.toLowerCase()) };
  }
  function encodeArray(value, { length, param }) {
    const dynamic = length === null;
    if (!Array.isArray(value))
      throw new InvalidArrayError(value);
    if (!dynamic && value.length !== length)
      throw new AbiEncodingArrayLengthMismatchError({
        expectedLength: length,
        givenLength: value.length,
        type: `${param.type}[${length}]`
      });
    let dynamicChild = value.length === 0 && isDynamicType(param);
    const preparedParams = [];
    for (let i = 0; i < value.length; i++) {
      const preparedParam = prepareParam({ param, value: value[i] });
      if (preparedParam.dynamic)
        dynamicChild = true;
      preparedParams.push(preparedParam);
    }
    if (dynamic || dynamicChild) {
      const data = encodeParams(preparedParams);
      if (dynamic) {
        const length2 = numberToHex(preparedParams.length, { size: 32 });
        return {
          dynamic: true,
          encoded: concatHex([length2, data])
        };
      }
      if (dynamicChild)
        return { dynamic: true, encoded: data };
    }
    return {
      dynamic: false,
      encoded: concatHex(preparedParams.map(({ encoded }) => encoded))
    };
  }
  function encodeBytes(value, { param }) {
    const [, paramSize] = param.type.split("bytes");
    const bytesSize = size(value);
    if (!paramSize) {
      let value_ = value;
      if (bytesSize % 32 !== 0)
        value_ = padHex(value_, {
          dir: "right",
          size: Math.ceil((value.length - 2) / 2 / 32) * 32
        });
      return {
        dynamic: true,
        encoded: concatHex([
          padHex(numberToHex(bytesSize, { size: 32 })),
          value_
        ])
      };
    }
    if (bytesSize !== Number.parseInt(paramSize, 10))
      throw new AbiEncodingBytesSizeMismatchError({
        expectedSize: Number.parseInt(paramSize, 10),
        value
      });
    return { dynamic: false, encoded: padHex(value, { dir: "right" }) };
  }
  function encodeBool(value) {
    if (typeof value !== "boolean")
      throw new BaseError2(`Invalid boolean value: "${value}" (type: ${typeof value}). Expected: \`true\` or \`false\`.`);
    return { dynamic: false, encoded: padHex(boolToHex(value)) };
  }
  function encodeNumber(value, { signed, size: size2 = 256 }) {
    if (typeof size2 === "number") {
      const max = 2n ** (BigInt(size2) - (signed ? 1n : 0n)) - 1n;
      const min = signed ? -max - 1n : 0n;
      if (value > max || value < min)
        throw new IntegerOutOfRangeError({
          max: max.toString(),
          min: min.toString(),
          signed,
          size: size2 / 8,
          value: value.toString()
        });
    }
    return {
      dynamic: false,
      encoded: numberToHex(value, {
        size: 32,
        signed
      })
    };
  }
  function encodeString(value) {
    const hexValue = stringToHex(value);
    const partsLength = Math.ceil(size(hexValue) / 32);
    const parts = [];
    for (let i = 0; i < partsLength; i++) {
      parts.push(padHex(slice(hexValue, i * 32, (i + 1) * 32), {
        dir: "right"
      }));
    }
    return {
      dynamic: true,
      encoded: concatHex([
        padHex(numberToHex(size(hexValue), { size: 32 })),
        ...parts
      ])
    };
  }
  function encodeTuple(value, { param }) {
    let dynamic = false;
    const preparedParams = [];
    for (let i = 0; i < param.components.length; i++) {
      const param_ = param.components[i];
      const index = Array.isArray(value) ? i : param_.name;
      const preparedParam = prepareParam({
        param: param_,
        value: value[index]
      });
      preparedParams.push(preparedParam);
      if (preparedParam.dynamic)
        dynamic = true;
    }
    return {
      dynamic,
      encoded: dynamic ? encodeParams(preparedParams) : concatHex(preparedParams.map(({ encoded }) => encoded))
    };
  }
  function getArrayComponents(type) {
    const matches = type.match(/^(.*)\[(\d+)?\]$/);
    return matches ? (
      // Return `null` if the array is dynamic.
      [matches[2] ? Number(matches[2]) : null, matches[1]]
    ) : void 0;
  }
  function isDynamicType(param) {
    const { type } = param;
    if (type === "string")
      return true;
    if (type === "bytes")
      return true;
    if (type.endsWith("[]"))
      return true;
    if (type === "tuple")
      return param.components.some(isDynamicType);
    const arrayComponents = getArrayComponents(type);
    if (arrayComponents)
      return isDynamicType({ ...param, type: arrayComponents[1] });
    return false;
  }
  var init_encodeAbiParameters = __esm({
    "node_modules/viem/_esm/utils/abi/encodeAbiParameters.js"() {
      init_abi();
      init_address();
      init_base();
      init_encoding();
      init_isAddress();
      init_concat();
      init_pad();
      init_size();
      init_slice();
      init_toHex();
      init_regex2();
    }
  });

  // node_modules/viem/_esm/utils/hash/toFunctionSelector.js
  var toFunctionSelector;
  var init_toFunctionSelector = __esm({
    "node_modules/viem/_esm/utils/hash/toFunctionSelector.js"() {
      init_slice();
      init_toSignatureHash();
      toFunctionSelector = (fn) => slice(toSignatureHash(fn), 0, 4);
    }
  });

  // node_modules/viem/_esm/errors/cursor.js
  var NegativeOffsetError, PositionOutOfBoundsError, RecursiveReadLimitExceededError;
  var init_cursor = __esm({
    "node_modules/viem/_esm/errors/cursor.js"() {
      init_base();
      NegativeOffsetError = class extends BaseError2 {
        constructor({ offset }) {
          super(`Offset \`${offset}\` cannot be negative.`, {
            name: "NegativeOffsetError"
          });
        }
      };
      PositionOutOfBoundsError = class extends BaseError2 {
        constructor({ length, position }) {
          super(`Position \`${position}\` is out of bounds (\`0 < position < ${length}\`).`, { name: "PositionOutOfBoundsError" });
        }
      };
      RecursiveReadLimitExceededError = class extends BaseError2 {
        constructor({ count, limit }) {
          super(`Recursive read limit of \`${limit}\` exceeded (recursive read count: \`${count}\`).`, { name: "RecursiveReadLimitExceededError" });
        }
      };
    }
  });

  // node_modules/viem/_esm/utils/cursor.js
  function createCursor(bytes, { recursiveReadLimit = 8192 } = {}) {
    const cursor = Object.create(staticCursor);
    cursor.bytes = bytes;
    cursor.dataView = new DataView(bytes.buffer ?? bytes, bytes.byteOffset, bytes.byteLength);
    cursor.positionReadCount = /* @__PURE__ */ new Map();
    cursor.recursiveReadLimit = recursiveReadLimit;
    return cursor;
  }
  var staticCursor;
  var init_cursor2 = __esm({
    "node_modules/viem/_esm/utils/cursor.js"() {
      init_cursor();
      staticCursor = {
        bytes: new Uint8Array(),
        dataView: new DataView(new ArrayBuffer(0)),
        position: 0,
        positionReadCount: /* @__PURE__ */ new Map(),
        recursiveReadCount: 0,
        recursiveReadLimit: Number.POSITIVE_INFINITY,
        assertReadLimit() {
          if (this.recursiveReadCount >= this.recursiveReadLimit)
            throw new RecursiveReadLimitExceededError({
              count: this.recursiveReadCount + 1,
              limit: this.recursiveReadLimit
            });
        },
        assertPosition(position) {
          if (position < 0 || position > this.bytes.length - 1)
            throw new PositionOutOfBoundsError({
              length: this.bytes.length,
              position
            });
        },
        decrementPosition(offset) {
          if (offset < 0)
            throw new NegativeOffsetError({ offset });
          const position = this.position - offset;
          this.assertPosition(position);
          this.position = position;
        },
        getReadCount(position) {
          return this.positionReadCount.get(position || this.position) || 0;
        },
        incrementPosition(offset) {
          if (offset < 0)
            throw new NegativeOffsetError({ offset });
          const position = this.position + offset;
          this.assertPosition(position);
          this.position = position;
        },
        inspectByte(position_) {
          const position = position_ ?? this.position;
          this.assertPosition(position);
          return this.bytes[position];
        },
        inspectBytes(length, position_) {
          const position = position_ ?? this.position;
          this.assertPosition(position + length - 1);
          return this.bytes.subarray(position, position + length);
        },
        inspectUint8(position_) {
          const position = position_ ?? this.position;
          this.assertPosition(position);
          return this.bytes[position];
        },
        inspectUint16(position_) {
          const position = position_ ?? this.position;
          this.assertPosition(position + 1);
          return this.dataView.getUint16(position);
        },
        inspectUint24(position_) {
          const position = position_ ?? this.position;
          this.assertPosition(position + 2);
          return (this.dataView.getUint16(position) << 8) + this.dataView.getUint8(position + 2);
        },
        inspectUint32(position_) {
          const position = position_ ?? this.position;
          this.assertPosition(position + 3);
          return this.dataView.getUint32(position);
        },
        pushByte(byte) {
          this.assertPosition(this.position);
          this.bytes[this.position] = byte;
          this.position++;
        },
        pushBytes(bytes) {
          this.assertPosition(this.position + bytes.length - 1);
          this.bytes.set(bytes, this.position);
          this.position += bytes.length;
        },
        pushUint8(value) {
          this.assertPosition(this.position);
          this.bytes[this.position] = value;
          this.position++;
        },
        pushUint16(value) {
          this.assertPosition(this.position + 1);
          this.dataView.setUint16(this.position, value);
          this.position += 2;
        },
        pushUint24(value) {
          this.assertPosition(this.position + 2);
          this.dataView.setUint16(this.position, value >> 8);
          this.dataView.setUint8(this.position + 2, value & ~4294967040);
          this.position += 3;
        },
        pushUint32(value) {
          this.assertPosition(this.position + 3);
          this.dataView.setUint32(this.position, value);
          this.position += 4;
        },
        readByte() {
          this.assertReadLimit();
          this._touch();
          const value = this.inspectByte();
          this.position++;
          return value;
        },
        readBytes(length, size2) {
          this.assertReadLimit();
          this._touch();
          const value = this.inspectBytes(length);
          this.position += size2 ?? length;
          return value;
        },
        readUint8() {
          this.assertReadLimit();
          this._touch();
          const value = this.inspectUint8();
          this.position += 1;
          return value;
        },
        readUint16() {
          this.assertReadLimit();
          this._touch();
          const value = this.inspectUint16();
          this.position += 2;
          return value;
        },
        readUint24() {
          this.assertReadLimit();
          this._touch();
          const value = this.inspectUint24();
          this.position += 3;
          return value;
        },
        readUint32() {
          this.assertReadLimit();
          this._touch();
          const value = this.inspectUint32();
          this.position += 4;
          return value;
        },
        get remaining() {
          return this.bytes.length - this.position;
        },
        setPosition(position) {
          const oldPosition = this.position;
          this.assertPosition(position);
          this.position = position;
          return () => this.position = oldPosition;
        },
        _touch() {
          if (this.recursiveReadLimit === Number.POSITIVE_INFINITY)
            return;
          const count = this.getReadCount();
          this.positionReadCount.set(this.position, count + 1);
          if (count > 0)
            this.recursiveReadCount++;
        }
      };
    }
  });

  // node_modules/viem/_esm/utils/encoding/fromBytes.js
  function bytesToBigInt(bytes, opts = {}) {
    if (typeof opts.size !== "undefined")
      assertSize(bytes, { size: opts.size });
    const hex = bytesToHex(bytes);
    return hexToBigInt(hex, opts);
  }
  function bytesToBool(bytes_, opts = {}) {
    let bytes = bytes_;
    if (typeof opts.size !== "undefined") {
      assertSize(bytes, { size: opts.size });
      bytes = trim(bytes);
    }
    if (bytes.length > 1 || bytes[0] > 1)
      throw new InvalidBytesBooleanError(bytes);
    return Boolean(bytes[0]);
  }
  function bytesToNumber(bytes, opts = {}) {
    if (typeof opts.size !== "undefined")
      assertSize(bytes, { size: opts.size });
    const hex = bytesToHex(bytes);
    return hexToNumber(hex, opts);
  }
  function bytesToString(bytes_, opts = {}) {
    let bytes = bytes_;
    if (typeof opts.size !== "undefined") {
      assertSize(bytes, { size: opts.size });
      bytes = trim(bytes, { dir: "right" });
    }
    return new TextDecoder().decode(bytes);
  }
  var init_fromBytes = __esm({
    "node_modules/viem/_esm/utils/encoding/fromBytes.js"() {
      init_encoding();
      init_trim();
      init_fromHex();
      init_toHex();
    }
  });

  // node_modules/viem/_esm/utils/abi/decodeAbiParameters.js
  function decodeAbiParameters(params, data) {
    const bytes = typeof data === "string" ? hexToBytes(data) : data;
    const cursor = createCursor(bytes);
    if (size(bytes) === 0 && params.length > 0)
      throw new AbiDecodingZeroDataError();
    if (size(data) && size(data) < 32)
      throw new AbiDecodingDataSizeTooSmallError({
        data: typeof data === "string" ? data : bytesToHex(data),
        params,
        size: size(data)
      });
    let consumed = 0;
    const values = [];
    for (let i = 0; i < params.length; ++i) {
      const param = params[i];
      if (consumed < bytes.length)
        cursor.setPosition(consumed);
      const [data2, consumed_] = decodeParameter(cursor, param, {
        staticPosition: 0
      });
      consumed += consumed_;
      values.push(data2);
    }
    return values;
  }
  function decodeParameter(cursor, param, { staticPosition }) {
    const arrayComponents = getArrayComponents(param.type);
    if (arrayComponents) {
      const [length, type] = arrayComponents;
      return decodeArray(cursor, { ...param, type }, { length, staticPosition });
    }
    if (param.type === "tuple")
      return decodeTuple(cursor, param, { staticPosition });
    if (param.type === "address")
      return decodeAddress(cursor);
    if (param.type === "bool")
      return decodeBool(cursor);
    if (param.type.startsWith("bytes"))
      return decodeBytes(cursor, param, { staticPosition });
    if (param.type.startsWith("uint") || param.type.startsWith("int"))
      return decodeNumber(cursor, param);
    if (param.type === "string")
      return decodeString(cursor, { staticPosition });
    throw new InvalidAbiDecodingTypeError(param.type, {
      docsPath: "/docs/contract/decodeAbiParameters"
    });
  }
  function decodeAddress(cursor) {
    const value = cursor.readBytes(32);
    return [checksumAddress(bytesToHex(sliceBytes(value, -20))), 32];
  }
  function decodeArray(cursor, param, { length, staticPosition }) {
    if (length === null) {
      const offset = bytesToNumber(cursor.readBytes(sizeOfOffset));
      const start = staticPosition + offset;
      const startOfData = start + sizeOfLength;
      cursor.setPosition(start);
      const length2 = bytesToNumber(cursor.readBytes(sizeOfLength));
      const dynamicChild = hasDynamicChild(param);
      let consumed2 = 0;
      const value2 = [];
      for (let i = 0; i < length2; ++i) {
        cursor.setPosition(startOfData + (dynamicChild ? i * 32 : consumed2));
        const [data, consumed_] = decodeParameter(cursor, param, {
          staticPosition: startOfData
        });
        consumed2 += consumed_;
        value2.push(data);
        if (consumed_ === 0) {
          cursor.assertReadLimit();
          cursor._touch();
        }
      }
      cursor.setPosition(staticPosition + 32);
      return [value2, 32];
    }
    if (hasDynamicChild(param)) {
      const offset = bytesToNumber(cursor.readBytes(sizeOfOffset));
      const start = staticPosition + offset;
      const value2 = [];
      for (let i = 0; i < length; ++i) {
        cursor.setPosition(start + i * 32);
        const [data] = decodeParameter(cursor, param, {
          staticPosition: start
        });
        value2.push(data);
      }
      cursor.setPosition(staticPosition + 32);
      return [value2, 32];
    }
    let consumed = 0;
    const value = [];
    for (let i = 0; i < length; ++i) {
      const [data, consumed_] = decodeParameter(cursor, param, {
        staticPosition: staticPosition + consumed
      });
      consumed += consumed_;
      value.push(data);
      if (consumed_ === 0) {
        cursor.assertReadLimit();
        cursor._touch();
      }
    }
    return [value, consumed];
  }
  function decodeBool(cursor) {
    return [bytesToBool(cursor.readBytes(32), { size: 32 }), 32];
  }
  function decodeBytes(cursor, param, { staticPosition }) {
    const [_, size2] = param.type.split("bytes");
    if (!size2) {
      const offset = bytesToNumber(cursor.readBytes(32));
      cursor.setPosition(staticPosition + offset);
      const length = bytesToNumber(cursor.readBytes(32));
      if (length === 0) {
        cursor.setPosition(staticPosition + 32);
        return ["0x", 32];
      }
      const data = cursor.readBytes(length);
      cursor.setPosition(staticPosition + 32);
      return [bytesToHex(data), 32];
    }
    const value = bytesToHex(cursor.readBytes(Number.parseInt(size2, 10), 32));
    return [value, 32];
  }
  function decodeNumber(cursor, param) {
    const signed = param.type.startsWith("int");
    const size2 = Number.parseInt(param.type.split("int")[1] || "256", 10);
    const value = cursor.readBytes(32);
    return [
      size2 > 48 ? bytesToBigInt(value, { signed }) : bytesToNumber(value, { signed }),
      32
    ];
  }
  function decodeTuple(cursor, param, { staticPosition }) {
    const hasUnnamedChild = param.components.length === 0 || param.components.some(({ name }) => !name);
    const value = hasUnnamedChild ? [] : {};
    let consumed = 0;
    if (hasDynamicChild(param)) {
      const offset = bytesToNumber(cursor.readBytes(sizeOfOffset));
      const start = staticPosition + offset;
      for (let i = 0; i < param.components.length; ++i) {
        const component = param.components[i];
        cursor.setPosition(start + consumed);
        const [data, consumed_] = decodeParameter(cursor, component, {
          staticPosition: start
        });
        consumed += consumed_;
        value[hasUnnamedChild ? i : component?.name] = data;
      }
      cursor.setPosition(staticPosition + 32);
      return [value, 32];
    }
    for (let i = 0; i < param.components.length; ++i) {
      const component = param.components[i];
      const [data, consumed_] = decodeParameter(cursor, component, {
        staticPosition
      });
      value[hasUnnamedChild ? i : component?.name] = data;
      consumed += consumed_;
    }
    return [value, consumed];
  }
  function decodeString(cursor, { staticPosition }) {
    const offset = bytesToNumber(cursor.readBytes(32));
    const start = staticPosition + offset;
    cursor.setPosition(start);
    const length = bytesToNumber(cursor.readBytes(32));
    if (length === 0) {
      cursor.setPosition(staticPosition + 32);
      return ["", 32];
    }
    const data = cursor.readBytes(length, 32);
    const value = bytesToString(data);
    cursor.setPosition(staticPosition + 32);
    return [value, 32];
  }
  function hasDynamicChild(param) {
    const { type } = param;
    if (type === "string")
      return true;
    if (type === "bytes")
      return true;
    if (type.endsWith("[]"))
      return true;
    if (type === "tuple")
      return param.components?.some(hasDynamicChild);
    const arrayComponents = getArrayComponents(param.type);
    if (arrayComponents && hasDynamicChild({ ...param, type: arrayComponents[1] }))
      return true;
    return false;
  }
  var sizeOfLength, sizeOfOffset;
  var init_decodeAbiParameters = __esm({
    "node_modules/viem/_esm/utils/abi/decodeAbiParameters.js"() {
      init_abi();
      init_getAddress();
      init_cursor2();
      init_size();
      init_slice();
      init_fromBytes();
      init_toBytes();
      init_toHex();
      init_encodeAbiParameters();
      sizeOfLength = 32;
      sizeOfOffset = 32;
    }
  });

  // node_modules/viem/_esm/utils/stringify.js
  var stringify;
  var init_stringify = __esm({
    "node_modules/viem/_esm/utils/stringify.js"() {
      stringify = (value, replacer, space) => JSON.stringify(value, (key, value_) => {
        const value2 = typeof value_ === "bigint" ? value_.toString() : value_;
        return typeof replacer === "function" ? replacer(key, value2) : value2;
      }, space);
    }
  });

  // node_modules/viem/_esm/utils/unit/Value.js
  function format(value, decimals = 0) {
    if (!Number.isInteger(decimals) || decimals < 0)
      throw new InvalidDecimalsError({ decimals });
    let display = value.toString();
    const negative = display.startsWith("-");
    if (negative)
      display = display.slice(1);
    display = display.padStart(decimals, "0");
    let [integer, fraction] = [
      display.slice(0, display.length - decimals),
      display.slice(display.length - decimals)
    ];
    fraction = fraction.replace(/(0+)$/, "");
    return `${negative ? "-" : ""}${integer || "0"}${fraction ? `.${fraction}` : ""}`;
  }
  function formatEther(wei, unit = "wei") {
    return format(wei, exponents.ether - exponents[unit]);
  }
  function formatGwei(wei, unit = "wei") {
    return format(wei, exponents.gwei - exponents[unit]);
  }
  var exponents, InvalidDecimalsError;
  var init_Value = __esm({
    "node_modules/viem/_esm/utils/unit/Value.js"() {
      exponents = {
        wei: 0,
        gwei: 9,
        szabo: 12,
        finney: 15,
        ether: 18
      };
      InvalidDecimalsError = class extends Error {
        constructor({ decimals }) {
          super(`\`decimals\` must be a non-negative integer. Got \`${decimals}\`.`);
          Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "Value.InvalidDecimalsError"
          });
        }
      };
    }
  });

  // node_modules/viem/_esm/utils/unit/formatEther.js
  function formatEther2(wei, unit = "wei") {
    return formatEther(wei, unit);
  }
  var init_formatEther = __esm({
    "node_modules/viem/_esm/utils/unit/formatEther.js"() {
      init_Value();
    }
  });

  // node_modules/viem/_esm/utils/unit/formatGwei.js
  function formatGwei2(wei, unit = "wei") {
    return formatGwei(wei, unit);
  }
  var init_formatGwei = __esm({
    "node_modules/viem/_esm/utils/unit/formatGwei.js"() {
      init_Value();
    }
  });

  // node_modules/viem/_esm/utils/abi/decodeFunctionData.js
  function decodeFunctionData(parameters) {
    const { abi, data } = parameters;
    const signature = slice(data, 0, 4);
    const description = abi.find((x) => x.type === "function" && signature === toFunctionSelector(formatAbiItem2(x)));
    if (!description)
      throw new AbiFunctionSignatureNotFoundError(signature, {
        docsPath: "/docs/contract/decodeFunctionData"
      });
    return {
      functionName: description.name,
      args: "inputs" in description && description.inputs && description.inputs.length > 0 ? decodeAbiParameters(description.inputs, slice(data, 4)) : void 0
    };
  }
  var init_decodeFunctionData = __esm({
    "node_modules/viem/_esm/utils/abi/decodeFunctionData.js"() {
      init_abi();
      init_slice();
      init_toFunctionSelector();
      init_decodeAbiParameters();
      init_formatAbiItem2();
    }
  });

  // playground/src/main.ts
  var main_exports = {};
  __export(main_exports, {
    EXAMPLES: () => examples_default,
    check: () => check,
    hashToRequest: () => hashToRequest,
    requestToHash: () => requestToHash
  });

  // node_modules/viem/_esm/index.js
  init_exports();

  // node_modules/viem/_esm/utils/signature/hashTypedData.js
  init_encodeAbiParameters();
  init_concat();
  init_toHex();
  init_keccak256();

  // node_modules/viem/_esm/utils/typedData.js
  init_abi();
  init_address();

  // node_modules/viem/_esm/errors/typedData.js
  init_stringify();
  init_base();
  var InvalidDomainError = class extends BaseError2 {
    constructor({ domain }) {
      super(`Invalid domain "${stringify(domain)}".`, {
        metaMessages: ["Must be a valid EIP-712 domain."]
      });
    }
  };
  var InvalidPrimaryTypeError = class extends BaseError2 {
    constructor({ primaryType, types }) {
      super(`Invalid primary type \`${primaryType}\` must be one of \`${JSON.stringify(Object.keys(types))}\`.`, {
        docsPath: "/api/glossary/Errors#typeddatainvalidprimarytypeerror",
        metaMessages: ["Check that the primary type is a key in `types`."]
      });
    }
  };
  var InvalidStructTypeError = class extends BaseError2 {
    constructor({ type }) {
      super(`Struct type "${type}" is invalid.`, {
        metaMessages: [
          'Struct type must contain only letters, digits, "_" and "$", and must not be a Solidity type.'
        ],
        name: "InvalidStructTypeError"
      });
    }
  };
  var InvalidTypedDataTypeError = class extends BaseError2 {
    constructor({ type }) {
      const canonicalType = type.replace(/^(u?int)/, "$&256");
      super(`Type "${type}" is not a valid EIP-712 type.`, {
        metaMessages: [`Use "${canonicalType}" instead.`],
        name: "InvalidTypedDataTypeError"
      });
    }
  };

  // node_modules/viem/_esm/utils/typedData.js
  init_isAddress();
  init_size();
  init_toHex();
  init_regex2();
  function validateTypedData(parameters) {
    const { domain, message, primaryType, types } = parameters;
    const validateData = (struct, data) => {
      for (const param of struct) {
        const { name, type } = param;
        const value = data[name];
        const baseType = type.replace(/(\[[0-9]*\])+$/, "");
        if (baseType === "int" || baseType === "uint")
          throw new InvalidTypedDataTypeError({ type });
        const integerMatch = type.match(integerRegex2);
        if (integerMatch && (typeof value === "number" || typeof value === "bigint")) {
          const [_type, base, size_] = integerMatch;
          numberToHex(value, {
            signed: base === "int",
            size: Number.parseInt(size_, 10) / 8
          });
        }
        if (type === "address" && typeof value === "string" && !isAddress(value))
          throw new InvalidAddressError({ address: value });
        const bytesMatch = type.match(bytesRegex2);
        if (bytesMatch) {
          const [_type, size_] = bytesMatch;
          if (size_ && size(value) !== Number.parseInt(size_, 10))
            throw new BytesSizeMismatchError({
              expectedSize: Number.parseInt(size_, 10),
              givenSize: size(value)
            });
        }
        const struct2 = types[type];
        if (struct2)
          validateData(struct2, value);
      }
    };
    for (const type of Object.keys(types))
      validateReference(type);
    if (types.EIP712Domain && domain) {
      if (typeof domain !== "object")
        throw new InvalidDomainError({ domain });
      validateData(types.EIP712Domain, domain);
    }
    if (primaryType !== "EIP712Domain") {
      if (types[primaryType])
        validateData(types[primaryType], message);
      else
        throw new InvalidPrimaryTypeError({ primaryType, types });
    }
  }
  function getTypesForEIP712Domain({ domain }) {
    return [
      typeof domain?.name === "string" && { name: "name", type: "string" },
      typeof domain?.version === "string" && { name: "version", type: "string" },
      (typeof domain?.chainId === "number" || typeof domain?.chainId === "bigint") && {
        name: "chainId",
        type: "uint256"
      },
      domain?.verifyingContract && {
        name: "verifyingContract",
        type: "address"
      },
      domain?.salt && { name: "salt", type: "bytes32" }
    ].filter(Boolean);
  }
  function validateReference(type) {
    if (!/^[A-Za-z0-9_$]+$/.test(type) || type === "address" || type === "bool" || type === "string" || /^(u?int|bytes)[0-9]*$/.test(type))
      throw new InvalidStructTypeError({ type });
  }

  // node_modules/viem/_esm/utils/signature/hashTypedData.js
  function hashTypedData(parameters) {
    const { domain = {}, message, primaryType } = parameters;
    const types = {
      EIP712Domain: getTypesForEIP712Domain({ domain }),
      ...parameters.types
    };
    validateTypedData({
      domain,
      message,
      primaryType,
      types
    });
    const parts = ["0x1901"];
    if (domain)
      parts.push(hashDomain({
        domain,
        types
      }));
    if (primaryType !== "EIP712Domain")
      parts.push(hashStruct({
        data: message,
        primaryType,
        types
      }));
    return keccak256(concat(parts));
  }
  function hashDomain({ domain, types }) {
    return hashStruct({
      data: domain,
      primaryType: "EIP712Domain",
      types
    });
  }
  function hashStruct({ data, primaryType, types }) {
    const encoded = encodeData({
      data,
      primaryType,
      types
    });
    return keccak256(encoded);
  }
  function encodeData({ data, primaryType, types }) {
    const encodedTypes = [{ type: "bytes32" }];
    const encodedValues = [hashType({ primaryType, types })];
    for (const field of types[primaryType]) {
      const [type, value] = encodeField({
        types,
        name: field.name,
        type: field.type,
        value: data[field.name]
      });
      encodedTypes.push(type);
      encodedValues.push(value);
    }
    return encodeAbiParameters(encodedTypes, encodedValues);
  }
  function hashType({ primaryType, types }) {
    const encodedHashType = toHex(encodeType({ primaryType, types }));
    return keccak256(encodedHashType);
  }
  function encodeType({ primaryType, types }) {
    let result2 = "";
    const unsortedDeps = findTypeDependencies({ primaryType, types });
    unsortedDeps.delete(primaryType);
    const deps = [primaryType, ...Array.from(unsortedDeps).sort()];
    for (const type of deps) {
      result2 += `${type}(${types[type].map(({ name, type: t }) => `${t} ${name}`).join(",")})`;
    }
    return result2;
  }
  function findTypeDependencies({ primaryType: primaryType_, types }, results = /* @__PURE__ */ new Set()) {
    const primaryType = primaryType_.replace(/(\[[0-9]*\])+$/, "");
    if (results.has(primaryType) || types[primaryType] === void 0) {
      return results;
    }
    results.add(primaryType);
    for (const field of types[primaryType]) {
      findTypeDependencies({ primaryType: field.type, types }, results);
    }
    return results;
  }
  function encodeField({ types, name, type, value }) {
    if (types[type] !== void 0) {
      return [
        { type: "bytes32" },
        keccak256(encodeData({ data: value, primaryType: type, types }))
      ];
    }
    if (type === "bytes")
      return [{ type: "bytes32" }, keccak256(value)];
    if (type === "string")
      return [{ type: "bytes32" }, keccak256(toHex(value))];
    if (type.lastIndexOf("]") === type.length - 1) {
      const parsedType = type.slice(0, type.lastIndexOf("["));
      const typeValuePairs = value.map((item) => encodeField({
        name,
        type: parsedType,
        types,
        value: item
      }));
      return [
        { type: "bytes32" },
        keccak256(encodeAbiParameters(typeValuePairs.map(([t]) => t), typeValuePairs.map(([, v]) => v)))
      ];
    }
    return [{ type }, value];
  }

  // node_modules/viem/_esm/index.js
  init_decodeFunctionData();
  init_getAddress();
  init_isHex();
  init_toBytes();
  init_toHex();
  init_keccak256();
  init_formatEther();
  init_formatGwei();

  // src/rlp.ts
  var RlpError = class extends Error {
    constructor(message) {
      super(message);
      this.name = "RlpError";
    }
  };
  function decodeAt(bytes, offset) {
    if (offset >= bytes.length) throw new RlpError("unexpected end of input");
    const b0 = bytes[offset];
    if (b0 <= 127) {
      return { item: bytes.slice(offset, offset + 1), next: offset + 1 };
    }
    if (b0 <= 183) {
      const len2 = b0 - 128;
      if (offset + 1 + len2 > bytes.length) throw new RlpError("short string overruns input");
      return { item: bytes.slice(offset + 1, offset + 1 + len2), next: offset + 1 + len2 };
    }
    if (b0 <= 191) {
      const lenOfLen2 = b0 - 183;
      if (offset + 1 + lenOfLen2 > bytes.length) throw new RlpError("long string length overruns input");
      const len2 = readLength(bytes, offset + 1, lenOfLen2);
      const start = offset + 1 + lenOfLen2;
      if (start + len2 > bytes.length) throw new RlpError("long string overruns input");
      return { item: bytes.slice(start, start + len2), next: start + len2 };
    }
    if (b0 <= 247) {
      const len2 = b0 - 192;
      return decodeList(bytes, offset + 1, offset + 1 + len2);
    }
    const lenOfLen = b0 - 247;
    if (offset + 1 + lenOfLen > bytes.length) throw new RlpError("long list length overruns input");
    const len = readLength(bytes, offset + 1, lenOfLen);
    return decodeList(bytes, offset + 1 + lenOfLen, offset + 1 + lenOfLen + len);
  }
  function readLength(bytes, offset, lenOfLen) {
    if (lenOfLen > 8) throw new RlpError("length-of-length too large");
    let len = 0;
    for (let i = 0; i < lenOfLen; i++) len = len * 256 + bytes[offset + i];
    return len;
  }
  function decodeList(bytes, start, end) {
    if (end > bytes.length) throw new RlpError("list overruns input");
    const items = [];
    let pos = start;
    while (pos < end) {
      const { item, next } = decodeAt(bytes, pos);
      if (next <= pos) throw new RlpError("decoder made no progress");
      items.push(item);
      pos = next;
    }
    if (pos !== end) throw new RlpError("list content length mismatch");
    return { item: items, next: end };
  }
  function decodeRlp(bytes) {
    const { item, next } = decodeAt(bytes, 0);
    if (next !== bytes.length) throw new RlpError("trailing bytes after RLP value");
    return item;
  }

  // src/abi.ts
  var KNOWN_ABI = parseAbi([
    "function transfer(address to, uint256 amount)",
    "function transferFrom(address from, address to, uint256 amount)",
    "function approve(address spender, uint256 amount)",
    "function setApprovalForAll(address operator, bool approved)",
    "function permit(address owner, address spender, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s)",
    "function deposit()",
    "function withdraw(uint256 amount)",
    "function multicall(bytes[] data)",
    "function execute(address to, uint256 value, bytes data)",
    "function swapExactTokensForTokens(uint256 amountIn, uint256 amountOutMin, address[] path, address to, uint256 deadline)"
  ]);
  var MAX_UINT256 = (1n << 256n) - 1n;
  function decodeCallData(data) {
    if (data === "0x" || data.length < 10) return null;
    const selector = data.slice(0, 10);
    const warnings = [];
    try {
      const { functionName, args } = decodeFunctionData({ abi: KNOWN_ABI, data });
      const a = [...args ?? []];
      let text = `${functionName}(${a.map(formatArg).join(", ")})`;
      switch (functionName) {
        case "approve": {
          const amount = a[1];
          warnings.push(
            amount === MAX_UINT256 || amount > 1n << 200n ? "TOKEN APPROVAL: grants the spender effectively UNLIMITED withdrawal rights over your tokens" : "TOKEN APPROVAL: grants the spender withdrawal rights over your tokens"
          );
          break;
        }
        case "setApprovalForAll": {
          const approved = a[1];
          if (approved) {
            warnings.push(
              "GRANTS OPERATOR CONTROL OF EVERY NFT YOU HOLD IN THIS COLLECTION \u2014 a full hand-over, not a single-item action"
            );
          } else {
            text += " (revokes operator control)";
          }
          break;
        }
        case "transfer":
        case "transferFrom": {
          text += " \u2014 amount is in the token\u2019s smallest unit (decimals not shown)";
          break;
        }
        case "permit": {
          warnings.push("OFF-CHAIN TOKEN PERMIT: this signature authorizes the spender to move your tokens");
          break;
        }
        default:
          break;
      }
      return { selector, text, warnings };
    } catch {
      return { selector, text: `unknown selector ${selector} (${byteLen(data)} bytes of calldata)`, warnings };
    }
  }
  function formatArg(arg) {
    if (typeof arg === "bigint") return arg.toString();
    if (Array.isArray(arg)) return `[${arg.map(formatArg).join(", ")}]`;
    return String(arg);
  }
  function byteLen(hex) {
    return (hex.length - 2) / 2;
  }

  // src/guard.ts
  var ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
  var PERSONAL_SIGN_TAG = "thereum Signed Message:\n";
  var TX_TYPES = {
    // Unsigned signing payloads (no yParity/r/s); +3 trailing items is the signed form.
    1: {
      name: "EIP-2930 access-list transaction",
      fields: ["chainId", "nonce", "gasPrice", "gasLimit", "to", "value", "data", "accessList"]
    },
    2: {
      name: "EIP-1559 transaction",
      fields: ["chainId", "nonce", "maxPriorityFeePerGas", "maxFeePerGas", "gasLimit", "to", "value", "data", "accessList"]
    },
    3: {
      name: "EIP-4844 blob transaction",
      fields: ["chainId", "nonce", "maxPriorityFeePerGas", "maxFeePerGas", "gasLimit", "to", "value", "data", "accessList", "maxFeePerBlobGas", "blobVersionedHashes"]
    },
    4: {
      name: "EIP-7702 set-code transaction",
      fields: ["chainId", "nonce", "maxPriorityFeePerGas", "maxFeePerGas", "gasLimit", "to", "value", "data", "accessList", "authorizationList"]
    }
  };
  function refuse(kind, reason, hash2) {
    return { verdict: "REFUSE", kind, title: reason, fields: [], warnings: [], reason, ...hash2 ? { hash: hash2 } : {} };
  }
  function result(verdict, kind, title, fields, warnings, reason, hash2, preimage) {
    return { verdict, kind, title, fields, warnings, reason, ...hash2 ? { hash: hash2 } : {}, ...preimage ? { preimage } : {} };
  }
  function bytesToBigInt2(b) {
    let v = 0n;
    for (const x of b) v = v << 8n | BigInt(x);
    return v;
  }
  function asBytes(item) {
    if (item instanceof Uint8Array) return item;
    throw new RlpError("expected bytes, found list");
  }
  function asList(item) {
    if (Array.isArray(item)) return item;
    throw new RlpError("expected list, found bytes");
  }
  function addr(b) {
    if (b.length === 0) return ZERO_ADDRESS;
    if (b.length !== 20) throw new RlpError(`address must be 20 bytes, got ${b.length}`);
    return getAddress(bytesToHex(b));
  }
  function isAllowlisted(allowlist, delegate, chainId) {
    return (allowlist ?? []).some(
      (e) => e.delegate.toLowerCase() === delegate.toLowerCase() && BigInt(e.chainId) === chainId
    );
  }
  function check(req, opts = {}) {
    let hash2 = req.hash;
    const { typedData } = req;
    if (hash2 && (!isHex(hash2) || hexToBytes(hash2).length !== 32)) {
      return refuse("invalid-input", "the digest is not a 32-byte hex string \u2014 cannot evaluate");
    }
    if (req.preimage !== void 0 && !isHex(req.preimage)) {
      return refuse("invalid-input", "the preimage is not hex \u2014 cannot evaluate", hash2);
    }
    if (typedData) {
      let digest2;
      try {
        digest2 = hashTypedData(typedData);
      } catch (e) {
        return refuse("malformed", `typed data could not be hashed: ${e.message}`, hash2);
      }
      if (hash2 && hash2.toLowerCase() !== digest2.toLowerCase()) {
        return refuse(
          "digest-mismatch",
          "the supplied EIP-712 typed data does not hash to the given digest \u2014 the request is inconsistent (possibly tampered with)",
          hash2
        );
      }
      hash2 = digest2;
    }
    let preimage = req.preimage;
    if (preimage !== void 0) {
      if (preimage === "0x" || hexToBytes(preimage).length === 0) {
        return refuse("invalid-input", "empty preimage \u2014 nothing to evaluate", hash2);
      }
      const computed = keccak256(preimage);
      if (hash2 && computed.toLowerCase() !== hash2.toLowerCase()) {
        return refuse(
          "digest-mismatch",
          "keccak256(preimage) does not equal the given digest \u2014 the request is inconsistent (possibly tampered with)",
          hash2
        );
      }
      hash2 = computed;
    }
    if (!preimage) {
      if (typedData) return render712(typedData, hash2);
      if (hash2) {
        return result(
          "REFUSE",
          "bare-hash",
          "A bare 32-byte digest \u2014 the request gives no preimage, so nothing can be shown about what it commits to.",
          [],
          [],
          "I can\u2019t see what this signs. Refusing. Resubmit with the preimage (and typed data for EIP-712) so the payload can be decoded.",
          hash2
        );
      }
      return refuse("invalid-input", "no digest, preimage, or typed data supplied \u2014 nothing to evaluate");
    }
    const bytes = hexToBytes(preimage);
    const digest = hash2;
    const b0 = bytes[0];
    try {
      if (b0 === 5) return decode7702(bytes.slice(1), opts, digest, preimage);
      if (b0 === 25) return decode191(bytes, typedData, digest, preimage);
      if (b0 >= 1 && b0 <= 4) return decodeTypedTx(b0, bytes.slice(1), opts, digest, preimage);
      if (b0 >= 192) return decodeLegacyTx(bytes, digest, preimage);
      return refuse(
        "unknown-prefix",
        `unrecognized payload prefix 0x${b0.toString(16).padStart(2, "0")} \u2014 not a known signing format`,
        digest
      );
    } catch (e) {
      if (e instanceof RlpError) {
        return refuse("malformed", `payload is not well-formed for its claimed format: ${e.message}`, hash2);
      }
      throw e;
    }
  }
  function decodeAuthPreimage(rest) {
    const list = asList(decodeRlp(rest));
    if (list.length !== 3) throw new RlpError(`authorization preimage must be a 3-item list, got ${list.length}`);
    const chainId = bytesToBigInt2(asBytes(list[0]));
    const delegate = addr(asBytes(list[1]));
    const nonce = bytesToBigInt2(asBytes(list[2]));
    return { chainId, delegate, nonce };
  }
  function decode7702(rest, opts, hash2, preimage) {
    const { chainId, delegate, nonce } = decodeAuthPreimage(rest);
    const revocation = delegate.toLowerCase() === ZERO_ADDRESS;
    const allowed = isAllowlisted(opts.allowlist, delegate, chainId);
    const fields = [
      { label: "chain_id", value: chainId.toString() },
      { label: "delegate", value: delegate },
      { label: "nonce", value: nonce.toString() }
    ];
    const warnings = [];
    if (chainId === 0n) warnings.push("chain_id = 0: this authorization is VALID ON EVERY CHAIN, not just one");
    if (revocation) fields.push({ label: "effect", value: "REVOCATION \u2014 clears any previously delegated code (delegate is the zero address)" });
    else
      fields.push({
        label: "effect",
        value: `${delegate}\u2019s code will execute AS THIS ACCOUNT \u2014 full control over its funds, with no amount or destination limit, until another authorization replaces it`
      });
    const title = revocation ? `EIP-7702 authorization (revocation) on chain ${chainId} at nonce ${nonce}` : `EIP-7702 delegation \u2192 ${delegate} runs as this account on chain ${chainId}, nonce ${nonce}`;
    if (allowed) {
      return result(
        "ALLOW_WITH_CONFIRMATION",
        "eip7702-authorization",
        title,
        fields,
        warnings,
        "EIP-7702 delegation to an explicitly allowlisted delegate + chain_id. Still requires human confirmation \u2014 the signature carries no amount or destination.",
        hash2,
        preimage
      );
    }
    return result(
      "BLOCK",
      "eip7702-authorization",
      title,
      fields,
      warnings,
      "EIP-7702 delegation blocked by default. This signature hands the account to a contract and carries no amount, destination, or calldata for a policy to check. Only an allowlisted delegate + chain_id may pass.",
      hash2,
      preimage
    );
  }
  function decode191(bytes, typedData, hash2, preimage) {
    if (bytes.length < 2) throw new RlpError("EIP-191 payload too short for a version byte");
    const version3 = bytes[1];
    if (version3 === 0) {
      if (bytes.length < 22) throw new RlpError("version 0x00 payload too short for a validator address");
      const validator = getAddress(bytesToHex(bytes.slice(2, 22)));
      const data = bytes.slice(22);
      return result(
        "ALLOW_WITH_CONFIRMATION",
        "eip191-v0",
        `EIP-191 v0: signs ${data.length} byte(s) of data bound to validator ${validator}`,
        [
          { label: "version", value: "0x00 (data with intended validator)" },
          { label: "validator", value: validator },
          { label: "data", value: bytesToHex(data) }
        ],
        [],
        "The signature is bound to one validator contract. Confirm the validator is expected.",
        hash2,
        preimage
      );
    }
    if (version3 === 1) {
      if (bytes.length !== 66) throw new RlpError(`version 0x01 payload must be 66 bytes, got ${bytes.length}`);
      if (!typedData) {
        return result(
          "BLOCK",
          "eip712-typed-data",
          "EIP-712 typed-data digest supplied without the typed data \u2014 only two opaque hashes are visible.",
          [
            { label: "domainSeparator", value: bytesToHex(bytes.slice(2, 34)) },
            { label: "hashStruct(message)", value: bytesToHex(bytes.slice(34, 66)) }
          ],
          ["Cannot show what this approves \u2014 resubmit with the EIP-712 typed data JSON so fields can be decoded and verified"],
          "An EIP-712 signature can approve permits, orders, and other high-value operations. Blocked: no typed data supplied.",
          hash2,
          preimage
        );
      }
      return render712(typedData, hash2, preimage, {
        domainSeparator: bytesToHex(bytes.slice(2, 34)),
        structHash: bytesToHex(bytes.slice(34, 66))
      });
    }
    if (version3 === 69) {
      const tagBytes = new TextEncoder().encode(PERSONAL_SIGN_TAG);
      for (let i = 0; i < tagBytes.length; i++) {
        if (bytes[2 + i] !== tagBytes[i]) throw new RlpError("version 0x45 payload missing the personal_sign tag");
      }
      let pos = 2 + tagBytes.length;
      let lenEnd = pos;
      while (lenEnd < bytes.length && bytes[lenEnd] >= 48 && bytes[lenEnd] <= 57) lenEnd++;
      if (lenEnd === pos) throw new RlpError("version 0x45 payload missing the decimal message length");
      const declaredLen = parseInt(new TextDecoder().decode(bytes.slice(pos, lenEnd)), 10);
      const message = bytes.slice(lenEnd);
      const lenOk = declaredLen === message.length;
      const printable = /^[\x20-\x7e\n\r\t]*$/.test(new TextDecoder("utf-8", { fatal: false }).decode(message));
      return result(
        "ALLOW_WITH_CONFIRMATION",
        "eip191-personal-sign",
        `EIP-191 personal_sign: signs a ${message.length}-byte message`,
        [
          { label: "declared length", value: `${declaredLen} byte(s)${lenOk ? "" : ` \u2014 MISMATCH: actual message is ${message.length} byte(s)`}` },
          { label: "message", value: printable ? new TextDecoder().decode(message) : `(non-UTF-8) ${bytesToHex(message)}` }
        ],
        lenOk ? [] : ["The declared length and actual message length differ \u2014 malformed or crafted payload"],
        "The message is shown in full above. Confirm it says what you expect \u2014 this signature is often used as proof of account ownership.",
        hash2,
        preimage
      );
    }
    return refuse(
      "eip191-unknown-version",
      `EIP-191 payload with unknown version byte 0x${version3.toString(16).padStart(2, "0")} \u2014 only 0x00, 0x01 and 0x45 are registered`,
      hash2
    );
  }
  function render712(typedData, hash2, preimage, parts) {
    const domain = typedData.domain ?? {};
    const primaryType = String(typedData.primaryType);
    const message = typedData.message;
    const typeNames = Object.keys(typedData.types ?? {}).filter((t) => t !== "EIP712Domain");
    const fields = [
      { label: "version", value: "0x01 (EIP-712 structured data) \u2014 digest recomputed and verified" },
      { label: "domain.name", value: String(domain.name ?? "(none)") },
      { label: "domain.version", value: String(domain.version ?? "(none)") },
      { label: "domain.chainId", value: String(domain.chainId ?? "(none)") },
      { label: "domain.verifyingContract", value: String(domain.verifyingContract ?? "(none)") },
      { label: "primaryType", value: primaryType }
    ];
    for (const [k, v] of Object.entries(message)) {
      fields.push({ label: `message.${k}`, value: typeof v === "object" ? JSON.stringify(v) : String(v) });
    }
    if (parts) {
      fields.push({ label: "domainSeparator", value: parts.domainSeparator });
      fields.push({ label: "hashStruct(message)", value: parts.structHash });
    }
    const warnings = [];
    const approvalPattern = /permit|approval/i;
    if (approvalPattern.test(primaryType) || typeNames.some((t) => approvalPattern.test(t))) {
      warnings.push(`APPROVAL-STYLE TYPED DATA: "${primaryType}" typically authorizes a spender/operator to move your tokens or NFTs`);
    }
    const grantKeys = Object.keys(message).filter((k) => /^(spender|operator|approved|allowance|permitted)$/i.test(k));
    if (grantKeys.length > 0 && warnings.length === 0) {
      warnings.push(`APPROVAL-STYLE TYPED DATA: message grants rights via field(s) ${grantKeys.join(", ")}`);
    }
    if (/setApprovalForAll|approvalForAll/i.test(primaryType) || /true/i.test(String(message.approved))) {
      warnings.push("GRANTS CONTROL OF EVERY TOKEN YOU HOLD IN THIS COLLECTION \u2014 not a single-item approval");
    }
    return result(
      "ALLOW_WITH_CONFIRMATION",
      "eip712-typed-data",
      `EIP-712 typed data "${primaryType}" for domain "${String(domain.name ?? "(unnamed)")}" \u2014 digest recomputed and matches`,
      fields,
      warnings,
      "Every field above is what the signature commits to. Confirm domain and fields \u2014 especially spender/operator rights \u2014 before signing.",
      hash2,
      preimage
    );
  }
  function decodeTypedTx(typeByte, rest, opts, hash2, preimage) {
    const def = TX_TYPES[typeByte];
    const list = asList(decodeRlp(rest));
    const unsigned = list.length === def.fields.length;
    const signed = list.length === def.fields.length + 3;
    if (!unsigned && !signed) {
      throw new RlpError(`${def.name} payload must have ${def.fields.length} fields (unsigned) or ${def.fields.length + 3} (signed), got ${list.length}`);
    }
    const get = (name) => asBytes(list[def.fields.indexOf(name)]);
    const chainId = bytesToBigInt2(get("chainId"));
    const nonce = bytesToBigInt2(get("nonce"));
    const to = addr(get("to"));
    const value = bytesToBigInt2(get("value"));
    const data = get("data");
    const gasLimit = bytesToBigInt2(get("gasLimit"));
    const fields = [
      { label: "type", value: `0x0${typeByte} \u2014 ${def.name}` },
      { label: "chain_id", value: chainId.toString() },
      { label: "nonce", value: nonce.toString() },
      { label: "to", value: to },
      { label: "value", value: `${formatEther2(value)} ETH (${value} wei)` },
      { label: "gas_limit", value: gasLimit.toString() }
    ];
    if (def.fields.includes("gasPrice")) fields.push({ label: "gas_price", value: `${formatGwei2(bytesToBigInt2(get("gasPrice")))} gwei` });
    if (def.fields.includes("maxFeePerGas")) {
      fields.push({ label: "max_fee_per_gas", value: `${formatGwei2(bytesToBigInt2(get("maxFeePerGas")))} gwei` });
      fields.push({ label: "max_priority_fee_per_gas", value: `${formatGwei2(bytesToBigInt2(get("maxPriorityFeePerGas")))} gwei` });
    }
    if (typeByte === 3) fields.push({ label: "max_fee_per_blob_gas", value: `${formatGwei2(bytesToBigInt2(get("maxFeePerBlobGas")))} gwei` });
    const warnings = [];
    const dataHex = bytesToHex(data);
    const call = decodeCallData(dataHex);
    fields.push({ label: "data", value: call ? call.text : dataHex === "0x" ? "(none \u2014 plain ETH transfer)" : `${(dataHex.length - 2) / 2} bytes: ${dataHex.slice(0, 18)}\u2026` });
    if (call) warnings.push(...call.warnings);
    if (signed) {
      const [yp, r, s] = list.slice(-3);
      fields.push(
        { label: "signature.yParity", value: bytesToBigInt2(asBytes(yp)).toString() },
        { label: "signature.r", value: bytesToHex(asBytes(r)) },
        { label: "signature.s", value: bytesToHex(asBytes(s)) }
      );
    }
    if (typeByte === 4) {
      const authList = asList(list[def.fields.indexOf("authorizationList")]);
      const blocked = [];
      authList.forEach((a, i) => {
        const items = asList(a);
        if (items.length !== 6) throw new RlpError(`authorization ${i} must have 6 fields, got ${items.length}`);
        const aChainId = bytesToBigInt2(asBytes(items[0]));
        const aDelegate = addr(asBytes(items[1]));
        const aNonce = bytesToBigInt2(asBytes(items[2]));
        const revocation = aDelegate.toLowerCase() === ZERO_ADDRESS;
        const allowed = isAllowlisted(opts.allowlist, aDelegate, aChainId);
        fields.push({
          label: `authorization[${i}]`,
          value: `${revocation ? "REVOCATION " : ""}delegate ${aDelegate}, chain_id ${aChainId}, nonce ${aNonce}${allowed ? " (allowlisted)" : ""}`
        });
        if (aChainId === 0n) warnings.push(`authorization[${i}]: chain_id 0 \u2014 valid on EVERY chain`);
        if (!allowed) blocked.push(`authorization[${i}]`);
      });
      if (authList.length === 0) warnings.push("authorization_list is EMPTY \u2014 invalid per EIP-7702 (a set-code transaction must carry at least one authorization)");
      if (blocked.length > 0) {
        return result(
          "BLOCK",
          "eip7702-set-code-tx",
          `EIP-7702 set-code transaction carrying ${authList.length} authorization(s)`,
          fields,
          warnings,
          `A set-code transaction commits ${authList.length} delegation(s) that hand accounts' execution to contracts \u2014 the same grant as a raw 0x05 authorization. Blocked: ${blocked.join(", ")} not allowlisted.`,
          hash2,
          preimage
        );
      }
    }
    return result(
      "ALLOW_WITH_CONFIRMATION",
      `typed-transaction-0x0${typeByte}`,
      `${def.name} to ${to} for ${formatEther2(value)} ETH on chain ${chainId}`,
      fields,
      warnings,
      "A normal transaction. Confirm recipient, value, and calldata before signing.",
      hash2,
      preimage
    );
  }
  function decodeLegacyTx(bytes, hash2, preimage) {
    const list = asList(decodeRlp(bytes));
    if (list.length !== 6 && list.length !== 9) {
      throw new RlpError(`legacy transaction must have 6 fields (unsigned) or 9 (signed), got ${list.length}`);
    }
    const names = ["nonce", "gasPrice", "gasLimit", "to", "value", "data"];
    const get = (i) => asBytes(list[i]);
    const nonce = bytesToBigInt2(get(0));
    const gasPrice = bytesToBigInt2(get(1));
    const gasLimit = bytesToBigInt2(get(2));
    const to = addr(get(3));
    const value = bytesToBigInt2(get(4));
    const data = bytesToHex(get(5));
    const fields = [
      { label: "type", value: "legacy (pre-EIP-2718)" },
      { label: "nonce", value: nonce.toString() },
      { label: "to", value: to },
      { label: "value", value: `${formatEther2(value)} ETH (${value} wei)` },
      { label: "gas_limit", value: gasLimit.toString() },
      { label: "gas_price", value: `${formatGwei2(gasPrice)} gwei` }
    ];
    const warnings = [];
    const call = decodeCallData(data);
    fields.push({ label: "data", value: call ? call.text : data === "0x" ? "(none \u2014 plain ETH transfer)" : `${(data.length - 2) / 2} bytes` });
    if (call) warnings.push(...call.warnings);
    if (list.length === 9) {
      const v = bytesToBigInt2(get(6));
      fields.push({ label: "signature.v", value: v.toString() });
      if (v >= 35n) fields.push({ label: "chain_id (EIP-155)", value: ((v - 35n) / 2n).toString() });
    }
    return result(
      "ALLOW_WITH_CONFIRMATION",
      "legacy-transaction",
      `legacy transaction to ${to} for ${formatEther2(value)} ETH`,
      fields,
      warnings,
      "A normal transaction. Confirm recipient, value, and calldata before signing.",
      hash2,
      preimage
    );
  }

  // playground/examples.json
  var examples_default = [
    {
      id: "binance14-authorization",
      label: "Binance 14 \u2014 real EIP-7702 authorization",
      blurb: "The actual authorization bytes signed by the Binance 14 hot wallet \u2014 entry #15 of carrier tx 0xad99264d5532ae0dd04b2004eebda05f25657e70dacb764f7ac8d4ccd051298b (Ethereum block 26300753, Oct 29 2026). Delegates the account to 0x63e8\u20266fAe. Real chain data, verified on-chain.",
      request: {
        hash: "0xac384c3e6b0b119b06b4f409343faffa32a7410c91e9f049684e59513d2674ac",
        preimage: "0x05db019463e842b054bd624a465454d533c33f573e9c6fae8401209df9"
      },
      expect: { verdict: "BLOCK", kind: "eip7702-authorization" },
      sources: [
        { label: "carrier tx on Etherscan", href: "https://etherscan.io/tx/0xad99264d5532ae0dd04b2004eebda05f25657e70dacb764f7ac8d4ccd051298b" },
        { label: "808bits byte-level write-up", href: "https://808bits.com/articles/binance-hot-wallet-eip-7702-delegations/" }
      ]
    },
    {
      id: "set-code-tx",
      label: "Type-4 transaction with an authorization list",
      blurb: "A 0x04 (EIP-7702 set-code) transaction preimage carrying the same real delegation in its authorization_list \u2014 same grant as a bare 0x05, same BLOCK. The authorization's signature fields are the real Binance 14 tuple from the carrier tx.",
      request: {
        preimage: "0x04f88b010a843b9aca00852e90edd0008307a1209428c6c06298d514db089934071355e5743bf21d608080c0f860f85e019463e842b054bd624a465454d533c33f573e9c6fae8401209df980a0ed435cb6590c132cb816dbd0dde4a21b8aaf7eea84927bc8950c314e9a92709aa01da64aaca69487253b1cb1cfff1977631c134d985f2c625450370850870adc75"
      },
      expect: { verdict: "BLOCK", kind: "eip7702-set-code-tx" },
      sources: [
        { label: "evals/set-code-tx-blocked", href: "https://github.com/naz3eh/pre-sign-guard/blob/main/evals/cases.json" }
      ]
    },
    {
      id: "eth-transfer",
      label: "Normal EIP-1559 ETH transfer",
      blurb: "A plain 0.25 ETH transfer (constructed test vector \u2014 same fixture as evals/eth-transfer-confirmed). Decodes all fields and is shown for confirmation.",
      request: {
        preimage: "0x02f0012a8459682f008506fc23ac008252089495222290dd7278aa3ddd389cc1e1d165cc4bafe58803782dace9d9000080c0"
      },
      expect: { verdict: "ALLOW_WITH_CONFIRMATION", kind: "typed-transaction-0x02" },
      sources: [
        { label: "evals/eth-transfer-confirmed", href: "https://github.com/naz3eh/pre-sign-guard/blob/main/evals/cases.json" }
      ]
    },
    {
      id: "personal-sign",
      label: "personal_sign message",
      blurb: "An EIP-191 v0x45 personal_sign preimage (constructed test vector \u2014 same fixture as evals/personal-sign-decoded). The guard shows the full message text before anyone signs it.",
      request: {
        preimage: "0x19457468657265756d205369676e6564204d6573736167653a0a34304920616d20617574686f72697a696e67206c6f67696e20666f72206167656e742e6578616d706c65"
      },
      expect: { verdict: "ALLOW_WITH_CONFIRMATION", kind: "eip191-personal-sign" },
      sources: [
        { label: "evals/personal-sign-decoded", href: "https://github.com/naz3eh/pre-sign-guard/blob/main/evals/cases.json" }
      ]
    },
    {
      id: "eip712-permit",
      label: "EIP-712 Permit (unlimited approval)",
      blurb: "A Permit typed-data payload granting the spender the uint256 maximum (constructed test vector \u2014 same fixture as evals/eip712-permit-flagged). The guard recomputes the digest and flags the approval loudly.",
      request: {
        typedData: {
          domain: { name: "USD Coin", version: "2", chainId: 1, verifyingContract: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" },
          types: {
            Permit: [
              { name: "owner", type: "address" },
              { name: "spender", type: "address" },
              { name: "value", type: "uint256" },
              { name: "nonce", type: "uint256" },
              { name: "deadline", type: "uint256" }
            ]
          },
          primaryType: "Permit",
          message: {
            owner: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
            spender: "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45",
            value: "115792089237316195423570985008687907853269984665640564039457584007913129639935",
            nonce: "0",
            deadline: "1893456000"
          }
        }
      },
      expect: { verdict: "ALLOW_WITH_CONFIRMATION", kind: "eip712-typed-data" },
      sources: [
        { label: "evals/eip712-permit-flagged", href: "https://github.com/naz3eh/pre-sign-guard/blob/main/evals/cases.json" }
      ]
    },
    {
      id: "bare-hash",
      label: "Bare 32-byte digest",
      blurb: "A signer handed only a hash \u2014 no preimage, nothing to decode (constructed test vector \u2014 same fixture as evals/bare-hash-refused). Refusing is the only honest answer.",
      request: {
        hash: "0xd4fd4e189132273036449fc9e11198c739161b4c0116a9a2dccdfa1c492006f1"
      },
      expect: { verdict: "REFUSE", kind: "bare-hash" },
      sources: [
        { label: "evals/bare-hash-refused", href: "https://github.com/naz3eh/pre-sign-guard/blob/main/evals/cases.json" }
      ]
    },
    {
      id: "unknown-prefix",
      label: "Unknown prefix",
      blurb: "A payload whose first byte matches no known signing format (constructed test vector \u2014 same fixture as evals/unknown-prefix-refused). Unknown means refused.",
      request: {
        preimage: "0x0a1234"
      },
      expect: { verdict: "REFUSE", kind: "unknown-prefix" },
      sources: [
        { label: "evals/unknown-prefix-refused", href: "https://github.com/naz3eh/pre-sign-guard/blob/main/evals/cases.json" }
      ]
    }
  ];

  // playground/src/main.ts
  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
  }
  function verdictClass(v) {
    return v === "BLOCK" ? "v-block" : v === "REFUSE" ? "v-refuse" : "v-ok";
  }
  function verdictLabel(v) {
    return v === "ALLOW_WITH_CONFIRMATION" ? "ALLOW with confirmation" : v;
  }
  function requestToHash(req) {
    return `#r=${encodeURIComponent(JSON.stringify(req))}`;
  }
  function hashToRequest(hash2) {
    const m = hash2.match(/^#r=(.*)$/s);
    if (!m) return null;
    try {
      return JSON.parse(decodeURIComponent(m[1]));
    } catch {
      return null;
    }
  }
  function wantsTypedData(req) {
    return !!req.typedData || (req.preimage ?? "").toLowerCase().startsWith("0x1901");
  }
  function initDom() {
    const $ = (sel) => {
      const el = document.querySelector(sel);
      if (!el) throw new Error(`missing element ${sel}`);
      return el;
    };
    const hashInput = $("#in-hash");
    const preimageInput = $("#in-preimage");
    const typedInput = $("#in-typeddata");
    const typedWrap = $("#typeddata-wrap");
    const out = $("#output");
    const examplesEl = $("#examples");
    function clean2(v) {
      const t = v.trim();
      return t ? t : void 0;
    }
    function readRequest() {
      let typedData;
      const td = clean2(typedInput.value);
      if (td) {
        try {
          typedData = JSON.parse(td);
        } catch (e) {
          return { error: `typed data is not valid JSON: ${e.message}` };
        }
      }
      return {
        req: {
          ...clean2(hashInput.value) ? { hash: hashInput.value.trim() } : {},
          ...clean2(preimageInput.value) ? { preimage: preimageInput.value.trim() } : {},
          ...typedData ? { typedData } : {}
        }
      };
    }
    function render(res, example) {
      const fields = res.fields.map((f) => `<div class="row"><dt>${esc(f.label)}</dt><dd>${esc(f.value)}</dd></div>`).join("");
      const warnings = res.warnings.map((w) => `<li>\u26A0 ${esc(w)}</li>`).join("");
      const sources = (example?.sources ?? []).map(
        (s) => `<a href="${esc(s.href)}" target="_blank" rel="noopener noreferrer">${esc(s.label)} \u2197</a>`
      ).join(" \xB7 ");
      out.innerHTML = `
      <div class="verdict-badge ${verdictClass(res.verdict)}" role="status" aria-live="polite">
        ${verdictLabel(res.verdict)}
      </div>
      <div class="kind">detected type: <code>${esc(res.kind)}</code>${example ? ` \xB7 expected: ${esc(example.expect.verdict)} (${esc(example.expect.kind)})` : ""}</div>
      <p class="title">${esc(res.title)}</p>
      ${warnings ? `<ul class="warnings">${warnings}</ul>` : ""}
      ${fields ? `<dl class="fields">${fields}</dl>` : ""}
      ${res.hash ? `<div class="digest"><span>digest</span><code>${esc(res.hash)}</code></div>` : ""}
      <div class="reason"><span>why</span><p>${esc(res.reason)}</p></div>
      ${sources ? `<div class="sources">${sources}</div>` : ""}
    `;
      out.hidden = false;
    }
    function showMessage(cls, label, msg) {
      out.innerHTML = `<div class="verdict-badge ${cls}" role="alert">${esc(label)}</div><div class="reason"><p>${esc(msg)}</p></div>`;
      out.hidden = false;
    }
    function runCheck(example) {
      const { req, error } = readRequest();
      if (error) return showMessage("v-refuse", "input error", error);
      if (!req?.hash && !req?.preimage && !req?.typedData) {
        return showMessage(
          "v-refuse",
          "nothing to check",
          "Paste a digest, a payload, or typed data \u2014 or click an example."
        );
      }
      let res;
      try {
        res = check(req);
      } catch (e) {
        return showMessage("v-refuse", "error", e.message);
      }
      render(res, example);
      history.replaceState(null, "", requestToHash(req));
    }
    function fillInputs(req) {
      hashInput.value = req.hash ?? "";
      preimageInput.value = req.preimage ?? "";
      typedInput.value = req.typedData ? JSON.stringify(req.typedData, null, 2) : "";
      typedWrap.open = wantsTypedData(req);
    }
    function loadExample(ex) {
      fillInputs(ex.request);
      runCheck(ex);
    }
    for (const ex of examples_default) {
      const card = document.createElement("button");
      card.className = "example";
      card.type = "button";
      card.dataset.example = ex.id;
      card.innerHTML = `<span class="ex-verdict ${verdictClass(ex.expect.verdict)}">${verdictLabel(ex.expect.verdict)}</span><span class="ex-label">${esc(ex.label)}</span><span class="ex-blurb">${esc(ex.blurb)}</span>`;
      card.addEventListener("click", () => loadExample(ex));
      examplesEl.appendChild(card);
    }
    $("#check-btn").addEventListener("click", () => runCheck());
    $("#copy-link").addEventListener("click", async () => {
      const btn = $("#copy-link");
      try {
        await navigator.clipboard.writeText(location.href);
        btn.textContent = "link copied";
      } catch {
        btn.textContent = location.href;
      }
      setTimeout(() => btn.textContent = "copy link", 1500);
    });
    window.addEventListener("hashchange", () => {
      const req = hashToRequest(location.hash);
      if (req) {
        fillInputs(req);
        runCheck();
      }
    });
    const initial = hashToRequest(location.hash);
    if (initial) {
      fillInputs(initial);
      runCheck();
    }
  }
  if (typeof document !== "undefined") {
    initDom();
  }
  return __toCommonJS(main_exports);
})();
/*! Bundled license information:

@noble/hashes/esm/utils.js:
  (*! noble-hashes - MIT License (c) 2022 Paul Miller (paulmillr.com) *)
*/
