import {ConcreteMapperType, MappingInstruction} from "./types";
import {AbstractMapper} from "./abstract-mapper";
import {map, Observable} from "rxjs";
import {genericArrayMapper, genericMapper} from "./mapper";
import {removeFirst} from "./utils";

export function PostMapping(...mappings: MappingInstruction[] | [AbstractMapper<any, any>] | [ConcreteMapperType]): Function {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const oldMethod = descriptor.value;
    descriptor.value = function (...args: any[]) {
      let originalResponse = oldMethod(...args);
      if (originalResponse instanceof Observable) {
        return originalResponse.pipe(
          map(obj => genericMapper(obj, obj, mappings, removeFirst(args), this))
        );
      }
      if (originalResponse instanceof Promise) {
        return new Promise((resolve, reject) => {
          return (originalResponse as Promise<any>)
            .then(obj => resolve(genericMapper(obj, obj, mappings, removeFirst(args), this)))
            .catch(reason => reject(reason))
        })
      }
      return genericMapper(originalResponse, originalResponse, mappings, removeFirst(args), this);
    };
  };
}

export function PostIgnore(...keys: string[]): Function {
  return PostMapping(...keys.map(v => ({ remove: v })))
}

export function PostArrayMapping(...mappings: MappingInstruction[] | [AbstractMapper<any, any>] | [ConcreteMapperType]): Function {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const oldMethod = descriptor.value;
    descriptor.value = function (...args: any[]) {
      let originalResponse = oldMethod(...args);
      if (originalResponse instanceof Observable) {
        return originalResponse.pipe(
          map(obj => genericArrayMapper(obj, obj, mappings as MappingInstruction[], removeFirst(args)))
        );
      }
      if (originalResponse instanceof Promise) {
        return new Promise((resolve, reject) => {
          return (originalResponse as Promise<any>)
            .then(obj => resolve(genericArrayMapper(obj, obj, mappings as MappingInstruction[], removeFirst(args))))
            .catch(reason => reject(reason))
        })
      }
      return genericArrayMapper(originalResponse, originalResponse, mappings as MappingInstruction[], removeFirst(args));
    };
  };
}

export function PostDateMapping(...targets: string[]): Function {
  return PostMapping(...targets.map(target => ({ target: target, source: target, transform: (s: string | number | Date) => new Date(s) })));
}

export function ClassMapping(...mappings: MappingInstruction[]): Function {
  return function <T extends ConcreteMapperType>(clazz: T) {
    return class extends clazz {
      override map(s: any, ...args: any[]): any {
        let superMapped = super.map(s);
        return genericMapper(s, superMapped, mappings, args, this);
      }
    }
  }
}
