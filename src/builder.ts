
import { Typing } from "@saggitarius/typing";
import * as Metadata from "./metadata";

export interface ICallableBuilder {
    addTypeParams(params?: Metadata.TypeIdentifier[] | Metadata.TypeIdentifier);
    setReturnType(type?: Metadata.TypeReference);
    addParameter(index: number): IParameterBuilder;
    setAsync(flag?: boolean);
    setGenerator(flag?: boolean);
}

export interface IFieldBuilder {
    setType(type?: Metadata.TypeReference);
}

export interface IMemberBuilder {
    setName(name?: string);
    setStatic(flag?: boolean);
    setAccess(access?: Metadata.Access);
}

export interface IPrototypeBuilder {
    addTypeParams(params?: Metadata.TypeIdentifier[] | Metadata.TypeIdentifier);
    addMethod(name?: string): IMethodBuilder;
    addProperty(name?: string): IPropertyBuilder;
}

export interface IModuleBuilder {
    addClass(name?: string): IClassBuilder;
    addInterface(name?: string): IInterfaceBuilder;
    addVariable(name?: string): IVariableBuilder;
    addFunction(name?: string): IFunctionBuilder;
}

export interface IVariableBuilder extends IFieldBuilder {
    setConstant(flag?: boolean);
}

export interface IFunctionBuilder extends ICallableBuilder {

}

export interface IPropertyBuilder extends IMemberBuilder, IFieldBuilder {
    setOptional(flag?: boolean);
    setReadonly(flag?: boolean);
}

export interface IMethodBuilder extends IMemberBuilder, ICallableBuilder {
    setAbstract(flag?: boolean);
}

export interface IConstructorBuilder {
    addProperty(name?: string): IPropertyBuilder;
    addParameter(index: number): IParameterBuilder;
}

export interface IParameterBuilder extends IFieldBuilder {
    setName(name?: string);
    setRest(flag?: boolean);
    setOptional(flag?: boolean);
}

export interface IClassBuilder extends IPrototypeBuilder {
    setAbstract(flag?: boolean);
    addConstructor(): IConstructorBuilder;
    setExtends(cls?: Metadata.TypeReference);
    addImplements(ifce?: Metadata.TypeReference[] | Metadata.TypeReference);
}

export interface IInterfaceBuilder extends IPrototypeBuilder {
    addExtends(cls?: Metadata.TypeReference[] | Metadata.TypeReference);
}

export class BuilderContext {
    private types: Record<string, Type> = {};

    public constructor(
        private module: string,
    ) {}

    public getTypes(types?: Metadata.TypeReference[]): Metadata.TypeReference[] | undefined {
        return types ? types.map((type) => this.getType(type)) : undefined;
    }

    public getType(type: Metadata.TypeReference): Metadata.TypeReference {
        if (typeof(type.name) === "string" && this.types[type.name]) {
            return {
                kind: Metadata.Kind.Type,
                name: this.types[type.name], 
                typeParameters: this.getTypes(type.typeParameters),
            };
        }
        return type;
    }

    public newType(name: string): Type {
        const type = Typing.type(`${this.module}::${name}`);
        this.types[name] = type;
        return type;
    }

    public addType(id: Metadata.TypeIdentifier) {
        const [name, type] = typeof(id) === "string"
            ? [id, this.newNamedType(id)]
            : [Typing.nameOf(id), id];
        this.types[name] = type;
    }

    public addTypes(ids?: Metadata.TypeIdentifier[]) {
        if (ids) {
            ids.forEach((id) => this.addType(id));
        } 
    }

    public fork(): BuilderContext {
        const child = new BuilderContext(this.module);
        Reflect.setPrototypeOf(child.types, this.types);
        return child;
    }

    private newNamedType(name: string): Type {
        const type = Typing.create();
        Reflect.defineProperty(type, Symbol.toStringTag, {
            enumerable: false,
            configurable: false,
            writable: false,
            value: name,
        });
        return type;
    }
}


export class FieldBuilder implements IFieldBuilder {
    public constructor(
        private field: Metadata.Field,
        protected ctx: BuilderContext,
    ) {}

    public setName(name?: string) {
        if (name) {
            this.field.name = name;
        }
    }

    public setType(type?: Metadata.TypeReference) {
        if (type) {
            this.field.type = this.ctx.getType(type);
        }
    }
}

export class CallableBuilder implements ICallableBuilder {
    public constructor(
        private callable: Metadata.Callable,
        protected ctx: BuilderContext,
    ) {
        this.ctx = ctx.fork();
    }

    public addParameter(index: number): ParameterBuilder {
        let param = this.callable.parameters[index];
        if (!param) {
            param = {kind: Metadata.Kind.Parameter, index};
            this.callable.parameters[index] = param;
        }
        return new ParameterBuilder(param, this.ctx);
    }
    
    public addTypeParams(param?: Metadata.TypeIdentifier[] | Metadata.TypeIdentifier) {
        if (param) {
            const params = Array.isArray(param) ? param : [param];
            this.callable.typeParameters = this.callable.typeParameters || [];
            this.callable.typeParameters.push(...params);
            this.ctx.addTypes(params);
        }
    }

    public setName(name?: string) {
        if (name) {
            this.callable.name = name;
        }
        return this
    }

    public setReturnType(type?: Metadata.TypeReference) {
        if (type) {
            this.callable.returnType = this.ctx.getType(type);
        }
        return this;
    }
    
    public setAsync(flag?: boolean) {
        this.callable.async = flag;
    }

    public setGenerator(flag?: boolean) {
        this.callable.generator = flag;
    }
}

export class PrototypeBuilder implements IPrototypeBuilder {
    public constructor(
        private proto: Metadata.Prototype,
        protected ctx: BuilderContext,
    ) {
        this.ctx = ctx.fork();
    }

    public setName(name?: string): PrototypeBuilder {
        if (name) {
            this.proto.name = name;
        }
        return this;
    }
    
    public addTypeParams(param?: Metadata.TypeIdentifier[] | Metadata.TypeIdentifier) {
        if (param) {
            const params = Array.isArray(param) ? param : [param];
            this.proto.typeParameters = this.proto.typeParameters || [];
            this.proto.typeParameters.push(...params);
            this.ctx.addTypes(params);
        }
    }

    public addMethod(name?: string): MethodBuilder {
        const method: Metadata.Method = {
            kind: Metadata.Kind.Method,
            name,
            parameters: [],
        };
        this.proto.methods.push(method);
        return new MethodBuilder(method, this.ctx);
    }

    public addProperty(name?: string): PropertyBuilder {
        const property: Metadata.Property = {
            kind: Metadata.Kind.Property,
            name,
        }
        this.proto.properties.push(property);
        return new PropertyBuilder(property, this.ctx);
    }
}

export class MemberBuilder implements IMemberBuilder {
    public constructor(
        private member: Metadata.Member,
        protected ctx: BuilderContext,
    ) {}

    public setName(name?: string) {
        if (name) {
            this.member.name = name;
        }
    }

    public setStatic(flag?: boolean) {
        this.member.static = flag;
    }

    public setAccess(access?: Metadata.Access) {
        this.member.access = access;
    }
}

export class FieldMemberBuilder extends FieldBuilder {
    public constructor(
        private member: Metadata.Member & Metadata.Field,
        protected ctx: BuilderContext,
    ) {
        super(member, ctx);
    }

    public setStatic(flag?: boolean) {
        MemberBuilder.prototype.setStatic.call(this, flag);
    }

    public setAccess(access?: Metadata.Access) {
        MemberBuilder.prototype.setAccess.call(this, access);
    }
}

export class CallableMemberBuilder extends CallableBuilder {
    public constructor(
        private member: Metadata.Member & Metadata.Callable,
        protected ctx: BuilderContext,
    ) {
        super(member, ctx);
    }

    public setStatic(flag?: boolean) {
        MemberBuilder.prototype.setStatic.call(this, flag);
    }

    public setAccess(access?: Metadata.Access) {
        MemberBuilder.prototype.setAccess.call(this, access);
    }
}


export class ParameterBuilder extends FieldBuilder {
    public constructor(
        private param: Metadata.Parameter,
        protected ctx: BuilderContext,
    ) {
        super(param, ctx);
    }
    
    public setRest(flag?: boolean) {
        this.param.rest = flag;
    }

    public setOptional(flag?: boolean) {
        this.param.optional = flag;
    }
}

export class FunctionBuilder extends CallableBuilder {

}

export class VariableBuilder extends FieldBuilder {
    public constructor(
        private val: Metadata.Variable,
        protected ctx: BuilderContext,
    ) {
        super(val, ctx);
    }

    public setConstant(flag?: boolean) {
        this.val.constant = flag;
    }
}

export class PropertyBuilder extends FieldMemberBuilder {
    public constructor(
        private property: Metadata.Property,
        protected ctx: BuilderContext,
    ) {
        super(property, ctx);
    }
    
    public setOptional(flag?: boolean) {
        this.property.optional = flag;
    }

    public setReadonly(flag?: boolean) {
        this.property.readonly = flag;
    }
}

export class MethodBuilder extends CallableMemberBuilder {
    public constructor(
        private method: Metadata.Method,
        protected ctx: BuilderContext,
    ) {
        super(method, ctx);
    }

    public setAbstract(flag?: boolean) {
        this.method.abstract = flag;
    }
}

export class ConstructorBuilder implements IConstructorBuilder {
    public constructor(
        private clsBuilder: IClassBuilder,
        private ctor: Metadata.Constructor,
        protected ctx: BuilderContext,
    ) {}

    public addParameter(index: number): IParameterBuilder {
        let param = this.ctor.parameters[index];
        if (!param) {
            param = {
                kind: Metadata.Kind.Parameter,
                index,
            };
            this.ctor.parameters[index] = param;
        }
        return new ParameterBuilder(param, this.ctx);
    }

    public addProperty(name?: string): IPropertyBuilder {
        return this.clsBuilder.addProperty(name);
    }
}

export class ClassBuilder extends PrototypeBuilder implements IClassBuilder {
    public constructor(
        private cls: Metadata.Class,
        protected ctx: BuilderContext,
    ) {
        super(cls, ctx);
    }
    
    public setAbstract(flag?: boolean) {
        this.cls.abstract = flag;
    }

    public addConstructor(): IConstructorBuilder {
        let ctor = this.cls.constructor;
        if (!ctor) {
            ctor = {
                kind: Metadata.Kind.Constructor,
                parameters: [],
            };
            this.cls.constructor = ctor;
        }
        return new ConstructorBuilder(this, ctor, this.ctx);
    }

    public setExtends(cls?: Metadata.TypeReference) {
        if (cls) {
            this.cls.extends = this.ctx.getType(cls);
        }
    }

    public addImplements(ifces?: Metadata.TypeReference[] | Metadata.TypeReference) {
        if (ifces) {
            ifces = Array.isArray(ifces) ? ifces : [ifces];
            this.cls.implements = this.cls.implements || [];
            this.cls.implements.push(...this.ctx.getTypes(ifces));
        } 
    }
}

export class InterfaceBuilder extends PrototypeBuilder implements IInterfaceBuilder {
    public constructor(
        private ifce: Metadata.Interface,
        protected ctx: BuilderContext,
    ) {
        super(ifce, ctx);
    }

    public addExtends(ifces?: Metadata.TypeReference[] | Metadata.TypeReference) {
        if (ifces) {
            ifces = Array.isArray(ifces) ? ifces : [ifces];
            this.ifce.extends = this.ifce.extends || [];
            this.ifce.extends.push(...this.ctx.getTypes(ifces));
        } 
    }
}

export class ModuleBuilder implements IModuleBuilder {
    private ctx: BuilderContext;

    public constructor(
        private module: Metadata.Module,
    ) {
        this.ctx = new BuilderContext(module.path);
    }

    public addClass(name: string): IClassBuilder {
        const cls: Metadata.Class = {
            kind: Metadata.Kind.Class,
            name,
            constructor: undefined,
            properties: [],
            methods: [],
        };
        if (name) {
            this.ctx.newType(name);
        }
        this.module.children.push(cls);
        return new ClassBuilder(cls, this.ctx);
    }

    public addInterface(name: string): IInterfaceBuilder {
        const ifce: Metadata.Interface = {
            kind: Metadata.Kind.Interface,
            name,
            properties: [],
            methods: [],
        };
        if (name) {
            this.ctx.newType(name);
        }
        this.module.children.push(ifce);
        return new InterfaceBuilder(ifce, this.ctx);

    }

    public addVariable(name: string): IVariableBuilder {
        const val: Metadata.Variable = {
            kind: Metadata.Kind.Variable,
            name,
        };
        this.module.children.push(val);
        return new VariableBuilder(val, this.ctx);
    }

    public addFunction(name: string): IFunctionBuilder {
        const fn: Metadata.Function = {
            kind: Metadata.Kind.Function,
            name,
            parameters: [],
        };
        this.module.children.push(fn);
        return new FunctionBuilder(fn, this.ctx);
    }
}
