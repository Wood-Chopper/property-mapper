import {AbstractMapper} from "./abstract-mapper.js";

export type ConcreteMapperType = {new(...args: any[]): AbstractMapper<any, any>};
export type ConcreteMapper = AbstractMapper<any, any>;

export class MappingOperation {
  constructor(public method: (k: any, ...args: any[]) => any = (v) => v) {
  }
}

export class SourceMapping extends MappingOperation {
  constructor(public source: string, public multipleSources: boolean, method?: (k: any, ...args: any[]) => any) {
    super(method)
  }
}

export class RemoveOperation {}

export class RootMapping extends SourceMapping {}

type MultipleSources = {
  multipleSources?: string,
}

type Source = {
  source: string;
}

type NoMultipleSource = {
  multipleSources?: never
}

type XorSource = (Source & { multipleSources?: never }) | (MultipleSources & { source?: never })

type TransformEach = {
  transformEach: ((i: any, ...args: any[]) => any) | ConcreteMapperType | AbstractMapper<any, any>
}

type Transform = {
  transform: ((i: any, ...args: any[]) => any) | ConcreteMapperType | AbstractMapper<any, any>,
}

type NoTransform = { transform?: never, transformEach?: never }

type XorTransform = (TransformEach & { transform?: never }) | (Transform & { transformEach?: never }) | NoTransform

type EMPTY = never | '' | '$' | string[] | null | undefined;

type NoRemove = { remove?: never }

export type SourceToRoot = {
  target?: EMPTY
} & XorSource & XorTransform & MultipleSources & NoRemove

export type RootToTarget = {
  source?: EMPTY
  target: string | string[];
} & XorTransform & NoMultipleSource & NoRemove

export type RootToRoot = {
  source?: EMPTY
  target?: EMPTY
} & XorTransform & NoMultipleSource & NoRemove

export type SourceToTarget = {
  target: string | string[];
} & XorSource & XorTransform & MultipleSources & NoRemove

export type Remove = {
  source?: EMPTY
  target?: EMPTY
  remove: string | string[];
} & NoTransform

export type MappingInstruction = RootToRoot | SourceToTarget | SourceToRoot | RootToTarget | Remove;

export type ConsolidatedMapping = {
  [key: string]: RemoveOperation | MappingOperation | ConsolidatedMapping
} | RootMapping

export function isSourceToRoot(mapping: MappingInstruction): mapping is SourceToRoot {
  let sourceToRoot = mapping as SourceToRoot;
  return !isEmpty(sourceToRoot.source) && isEmpty(sourceToRoot.target);
}

export function isRootToTarget(mapping: MappingInstruction): mapping is RootToTarget {
  let rootToTarget = mapping as RootToTarget;
  return isEmpty(rootToTarget.source) && !isEmpty(rootToTarget.target);
}

export function isSourceToTarget(mapping: MappingInstruction): mapping is SourceToTarget {
  let sourceToTarget = mapping as SourceToTarget;
  return !isEmpty(sourceToTarget.source) && !isEmpty(sourceToTarget.target);
}

export function isRootToRoot(mapping: MappingInstruction): mapping is RootToRoot {
  let rootToRoot = mapping as RootToRoot;
  return isEmpty(rootToRoot.source) && isEmpty(rootToRoot.target) && isEmpty(mapping.remove);
}

export function isEmpty(value: EMPTY | string[] | string ): value is EMPTY {
  return !value || value === '' || value === '$' || value === [];
}

export function isNotEmpty(value: EMPTY | string | string[] ): value is string | string[] {
  return !isEmpty(value);
}

export function isRemove(mapping: MappingInstruction): mapping is Remove {
  let rootToRoot = mapping as Remove;
  return isEmpty(rootToRoot.source) && isEmpty(rootToRoot.target) && isNotEmpty(rootToRoot.remove);
}

function isTransformElement(mapping: MappingInstruction): mapping is Transform {
  return !!(mapping as Transform).transform;
}

function isTransformEach(mapping: MappingInstruction): mapping is TransformEach {
  return !!(mapping as TransformEach).transformEach;
}

