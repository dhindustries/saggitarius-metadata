import { Typing } from "@saggitarius/typing";

export enum Access {
    Public = "public",
    Protected = "protected",
    Private = "private",
}

export enum Kind {
    Unknown = "unknown",
    Variable = "variable",
    Function = "function",
    Class = "class",
    Interface = "interface",
    Method = "method",
    Constructor = "constructor",
    Property = "property",
    Parameter = "parameter",
    Module = "module",
    Program = "program",
    Type = "type",
}

export type TypeIdentifier = Type<unknown> | string;

export interface TypeReference {
    kind: Kind.Type,
    name?: TypeIdentifier;
    typeParameters?: TypeReference[];
}

export interface Program {
    readonly kind: Kind.Program;
    modules: {
        [path: string]: Module;
    };
}

export interface Module {
    readonly kind: Kind.Module;
    path: string;
    imports: {
        [path: string]: {
            [alias: string]: string;
        };
    };
    exports: {
        [alias: string]: string;
    };
    children: Entry[];
}

export interface Variable {
    readonly kind: Kind.Variable;
    name: string;
    type?: TypeReference;
    constant?: boolean;
}

export interface Function {
    readonly kind: Kind.Function;
    name: string;
    parameters: Parameter[];
    returnType?: TypeReference;
    typeParameters?: TypeIdentifier[];
    async?: boolean;
    generator?: boolean;
}

export interface Property {
    readonly kind: Kind.Property;
    name?: string;
    type?: TypeReference;
    access?: Access;
    static?: boolean;
    optional?: boolean;
    readonly?: boolean;
}

export interface Method {
    readonly kind: Kind.Method;
    name?: string;
    parameters: Parameter[];
    returnType?: TypeReference;
    access?: Access;
    static?: boolean;
    abstract?: boolean;
    async?: boolean;
    generator?: boolean;
    typeParameters?: TypeIdentifier[];
}

export interface Constructor {
    readonly kind: Kind.Constructor;
    parameters: Parameter[];
}

export interface Parameter {
    readonly kind: Kind.Parameter; 
    index: number;
    name?: string;
    type?: TypeReference;
    rest?: boolean;
    optional?: boolean;
}

export interface Interface {
    readonly kind: Kind.Interface;
    name: string;
    properties: Property[];
    methods: Method[];
    extends?: TypeReference[];
    typeParameters?: TypeIdentifier[];
}

export interface Class {
    readonly kind: Kind.Class;
    name: string;
    properties: Property[];
    methods: Method[];
    extends?: TypeReference;
    implements?: TypeReference[];
    constructor?: Constructor;
    abstract?: boolean;
    typeParameters?: TypeIdentifier[];
}

export type Prototype = Class | Interface;
export type Field = Variable | Property | Parameter;
export type Callable = Function | Method;
export type Member = Method | Property;
export type Entry = Class | Interface | Variable | Function;
export type Any = Variable | Function | Method | Property | Constructor | Parameter | Class | Interface | Module | Program;

/*

const MetadataSymbol = Symbol("metadata");
const ParentSymbol = Symbol("parent");
const TypeSymbol = Symbol("type");

export function declare<T extends (...args: unknown[]) => unknown>(type: Type<T>, metadata: Function): void;
export function declare<T extends new (...args: unknown[]) => unknown>(type: Type<T>, metadata: Class): void;
export function declare<T extends Record<string, unknown>>(type: Type<T>, metadata: Module): void;
export function declare<T>(type: Type<T>, metadata: Any): void {
    Reflect.defineProperty(type, MetadataSymbol, {
        enumerable: false,
        writable: false,
        configurable: false,
        value: metadata,
    });
}

export function resolve<T extends (...args: unknown[]) => unknown>(type: Type<T>): Function|Any|undefined;
export function resolve<T extends new (...args: unknown[]) => unknown>(type: Type<T>): Class|Any|undefined;
export function resolve<T extends Record<string, unknown>>(type: Type<T>): Module|Any|undefined;
export function resolve<T>(type: Type<T>): Any|undefined {
    return Reflect.get(type, MetadataSymbol);
}

export function getModule(metadata: Any | TypeReference): Module | undefined {
    while (metadata.kind !== Kind.Module) {
        metadata = getParent(metadata);
    }
    return metadata;
}

export function getProgram(metadata: Any | TypeReference): Program | undefined {
    while (metadata.kind !== Kind.Program) {
        metadata = getParent(metadata);
    }
    return metadata;
}

export function setParent(metadata: Any | TypeReference, parent: Any): void {
    if (metadata.kind !== Kind.Type && getParents(parent).includes(metadata)) {
        throw new Error("Cyclic parenthiness");
    }
    Reflect.defineProperty(metadata, ParentSymbol, {
        enumerable: false,
        writable: false,
        configurable: false,
        value: parent,
    });
}

export function getParents(metadata: Any | TypeReference): Any[] {
    return Array.from(getParentIterator(metadata));
}

export function getParentIterator(metadata: Any | TypeReference): Iterable<Any> {
    let cursor: Any;
    const iterator: Iterator<Any> = {
        next(): IteratorResult<Any> {
            cursor = getParent(cursor || metadata);
            return {
                done: typeof(cursor) === "undefined",
                value: cursor,
            };
        }
    };
    return {
        [Symbol.iterator]: () => iterator,
    };
}

export function getParent(metadata: Any | TypeReference): Any|undefined {
    return Reflect.get(metadata, ParentSymbol);
}

function getModuleType(path: string, module: Record<string, unknown>): Type<unknown> {
    let type = Typing.restore(module);
    if (!type) {
        type = Typing.fromName(`Module<${path}>`);
        Typing.store(module, type);
    }
    return type;
}

*/