import {JSONPath} from "jsonpath-plus"
import {AbstractMapper} from "./abstract-mapper.js";
import {
  ConcreteMapper,
  ConcreteMapperType,
  ConsolidatedMapping, isEmpty, isNotEmpty, isRemove, isRootToRoot, isRootToTarget, isSourceToRoot, isSourceToTarget,
  MappingInstruction, MappingOperation,
  RemoveOperation,
  RootMapping,
  SourceMapping
} from "./types.js";
import {removeFirst} from "./utils.js";

export function genericMapper(sourceObject: any, buildingTarget: any, mappings: MappingInstruction[] | [AbstractMapper<any, any>] | [ConcreteMapperType], args: any[], contextClass: any = {}): any {

  if (sourceObject === undefined || sourceObject === null || mappings.length === 0) {
    return buildingTarget;
  }

  if (mappings[0] instanceof AbstractMapper) {
    const concreteMapper = mappings[0];
    return concreteMapper.map(buildingTarget);
  }

  if (mappings[0] instanceof Function) {
    const concreteMapper = new mappings[0]();
    return concreteMapper.map(buildingTarget);
  }

  const consolidatedMapping: ConsolidatedMapping = toConsolidateMapping(mappings as MappingInstruction[], contextClass, args);


  return consolidatedGenericMapper(sourceObject, buildingTarget, consolidatedMapping, sourceObject);
}

export function genericArrayMapper(sourceObject: any[], buildingTarget: any, mappings: MappingInstruction[] | [AbstractMapper<any, any>] | [ConcreteMapperType], args: any[], contextClass: any = {}): any {
  if (sourceObject === undefined || sourceObject === null) {
    return sourceObject
  }

  if (mappings[0] instanceof AbstractMapper) {
    const concreteMapper = mappings[0];
    return concreteMapper.arrayMap(sourceObject);
  }

  if (mappings[0] instanceof Function) {
    const concreteMapper = new mappings[0]();
    return concreteMapper.arrayMap(sourceObject);
  }

  const consolidatedMapping = toConsolidateMapping(mappings as MappingInstruction[], contextClass, args);

  return sourceObject.map((innerObj, i) => consolidatedGenericMapper(innerObj, buildingTarget[i], consolidatedMapping, innerObj));
}

function toConsolidateMapping(mappings: MappingInstruction[], contextClass: any, args: any[]): ConsolidatedMapping {
  let mappers: ConcreteMapper[] = dependencies(mappings, contextClass);
  const cleanedMappins: MappingInstruction[] = cleanMapping(mappings, args, mappers);
  return consolidate(cleanedMappins);
}

function dependencies(mappings: MappingInstruction[], contextClass: any): ConcreteMapper[] {
  const requieredMappers: ConcreteMapperType[] = mappings
    .map(mapping => mapping.transform||mapping.transformEach)
    .filter(transform => !!transform)
    .filter(transform => transform instanceof Function && transform.prototype?.constructor)
    .map(mapper => mapper as ConcreteMapperType)
    .filter((v, i, self) => self.indexOf(v) === i);

  const availableDependencies = Object.entries(contextClass).map(([_, value]) => value);

  return requieredMappers.map(mapper => {
    const availableMapper: ConcreteMapper = availableDependencies.find(dependency => dependency instanceof mapper) as ConcreteMapper;
    return availableMapper || new mapper();
  });
}

function cleanMapping(mappings: MappingInstruction[], args: any[], mappers: ConcreteMapper[]): MappingInstruction[] {

  return mappings.map(mapping => {

    if (isRemove(mapping)) {
      return { remove: toArrayPath(mapping.remove) };
    }

    const transform = mapping.transform||mapping.transformEach;

    const concreteMapper: ConcreteMapper | undefined = transform instanceof Function && transform?.prototype?.constructor ?
      mappers.find(mapper => mapper instanceof (transform as ConcreteMapperType)) :
      undefined;
    const concreteMapperImpl: ((v: any) => any) | undefined = concreteMapper ? (v) => concreteMapper.map.bind(concreteMapper)(v, ...args) : undefined;

    const abstractMapper: ((v: any) => any) | undefined = transform instanceof AbstractMapper ? (v: any) => ((transform as AbstractMapper<any, any>).map(v, ...args)) : undefined;

    const methodImpl: ((v: any) => any) | undefined = transform instanceof Function && !transform.prototype ?
      (v: any) => (transform as (i: any, ...args: any[]) => any)(v, ...args) :
      undefined;

    let choosenMethod = concreteMapperImpl||abstractMapper||methodImpl;

    choosenMethod = choosenMethod && mapping.transformEach ? transformEach(choosenMethod) : choosenMethod;
    return ({...mapping,
      target: isNotEmpty(mapping.target) ? toArrayPath(mapping.target) : undefined,
      source: isEmpty(mapping.source) && isEmpty(mapping.multipleSources) ? '$' : mapping.source,
      transform: choosenMethod
    }) as MappingInstruction
  });
}

function consolidate(mappings: MappingInstruction[]): ConsolidatedMapping {
  let consolidated: ConsolidatedMapping = {}

  for(let mapping of mappings) {
    if (isRootToRoot(mapping) || isSourceToRoot(mapping)) {
      return new RootMapping((mapping.source||mapping.multipleSources) as string, !!mapping.multipleSources, mapping.transform as (v: any) => any)
    }
    if (isRemove(mapping)) {
      const key = mapping.remove[0];
      if (!mapping.remove[1]) {
        consolidated[key] = new RemoveOperation()
      } else {
        const keyMapping: MappingInstruction[] = subMapping(key, mappings)
        consolidated[key] = consolidate(keyMapping)
      }
    }
    if (isRootToTarget(mapping) || isSourceToTarget(mapping)) {
      const key = mapping.target[0];
      if (!mapping.target[1]) {
        consolidated[key] = new SourceMapping((mapping.source||mapping.multipleSources) as string, !!mapping.multipleSources, mapping.transform as (v: any) => any)
      } else {
        const keyMapping: MappingInstruction[] = subMapping(key, mappings)
        consolidated[key] = consolidate(keyMapping)
      }
    }
  }
  return consolidated;
}

function consolidatedGenericMapper(sourceObject: any, buildingTarget: any, consolidatedMapping: ConsolidatedMapping, fullSourceObject: any): any {
  if (consolidatedMapping instanceof RootMapping) {
    return evaluatePath(sourceObject, consolidatedMapping);
  }
  let buildingTargetKeys = buildingTarget ? Object.keys(buildingTarget) : [];
  let mappingKeys = Object.keys(consolidatedMapping);
  let keys = [ ...buildingTargetKeys, ...mappingKeys].filter((v, i, self) => self.indexOf(v) === i)
  return keys.filter(key => !(consolidatedMapping[key] instanceof RemoveOperation))
    .map<[string, any]>(key => ([key, consolidatedMapping[key] ? mapObject(sourceObject, buildingTarget, <ConsolidatedMapping | SourceMapping> consolidatedMapping[key], key, fullSourceObject) : buildingTarget[key]]))
    .reduce<{[k: string]: any}>((acc, [key, value]) => ({ ...acc, [key]: value }), {});
}

function toArrayPath(path: string | string[]): string[] {
  return typeof path === 'string' ? JSONPath.toPathArray(path) : path as string[];
}

function evaluatePath(sourceObject: any, mappingOperation: SourceMapping): any {
  let jsonResult: any[] = JSONPath({path: mappingOperation.source, json: sourceObject});
  const result = mappingOperation.multipleSources ? jsonResult : jsonResult[0];
  return mappingOperation.method(result);
}

function mapObject(sourceObject: any, buildingTarget: any, consolidatedMapping: ConsolidatedMapping | SourceMapping, key: string, fullSourceObject: any): any {
  if (consolidatedMapping instanceof MappingOperation) {
    return evaluatePath(fullSourceObject, consolidatedMapping)
  }
  return consolidatedGenericMapper(sourceObject[key], buildingTarget[key], consolidatedMapping, sourceObject);
}

function transformEach(transformation: (v: any) => any): (v: any) => any {
  return (items: any[]) => items.map(item => transformation(item));
}

function subMapping(key: any, mappings: MappingInstruction[]): MappingInstruction[] {
  return mappings.map(mapping => {
    if (mapping.target && mapping.target[0] !== key) {
      return null;
    }
    return {
      ...mapping,
      target: mapping.target ? removeFirst(mapping.target as string[]) : undefined
    }
  }).filter(mapping => !!mapping) as MappingInstruction[]
}
