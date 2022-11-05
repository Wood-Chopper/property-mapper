import {ConcreteMapperType, MappingInstruction} from "./types";
import {AbstractMapper} from "./abstract-mapper";
import {map, Observable} from "rxjs";
import {genericArrayMapper, genericMapper} from "./mapper";
import {removeFirst} from "./utils";

function mapObjectOrArray(sourceObject: any, buildingTarget: any, mappings: MappingInstruction[] | [AbstractMapper<any, any>] | [ConcreteMapperType], args: any[], contextClass: any = {}) {
  return sourceObject instanceof Array ?
      genericArrayMapper(sourceObject, buildingTarget, mappings, args, contextClass) :
      genericMapper(sourceObject, buildingTarget, mappings, args, contextClass)
}

function postMappingOnDescriptor(descriptor: PropertyDescriptor, mappings: MappingInstruction[] | [AbstractMapper<any, any>] | [ConcreteMapperType]) {
  const oldMethod = descriptor.value;
  descriptor.value = function (...args: any[]) {
    let originalResponse = oldMethod.bind(this)(...args);
    if (originalResponse instanceof Observable) {
      return originalResponse.pipe(
          map(obj => mapObjectOrArray(obj, obj, mappings, removeFirst(args), this))
      );
    }
    if (originalResponse instanceof Promise) {
      return new Promise((resolve, reject) => {
        return (originalResponse as Promise<any>)
            .then(obj => resolve(mapObjectOrArray(obj, obj, mappings, removeFirst(args), this)))
            .catch(reason => reject(reason))
      })
    }
    return mapObjectOrArray(originalResponse, originalResponse, mappings, removeFirst(args), this);
  };
}

function mappingOnClass(target: any, mappings: MappingInstruction[] | [AbstractMapper<any, any>] | [ConcreteMapperType]) {
  return class extends (target as ConcreteMapperType) {
    override map(s: any, ...args: any[]): any {
      let superMapped = super.map(s);
      return genericMapper(s, superMapped, mappings, args, this);
    }
  }
}

export function Ignore(...keys: string[]): Function {
  return Mapping(...keys.map(v => ({ remove: v })))
}

export function DateMapping(...targets: string[]): Function {
  return Mapping(...targets.map(target => ({ target: target, source: target, transform: (s: string | number | Date) => new Date(s) })));
}

export function Mapping(...mappings: MappingInstruction[] | [AbstractMapper<any, any>] | [ConcreteMapperType]): Function {
  return function (
      target: { constructor: Function } | ConcreteMapperType,
      propertyKey?: string,
      descriptor?: PropertyDescriptor
  ) {
    if (!propertyKey && !descriptor) {
      return mappingOnClass(target, mappings);
    } else {
      postMappingOnDescriptor(descriptor as PropertyDescriptor, mappings);
    }
  }
}
