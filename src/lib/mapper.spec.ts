import {PostArrayMapping, ClassMapping, PostDateMapping, PostIgnore, PostMapping} from "./decorator.js";
import {Observable, of} from "rxjs";
import {AbstractMapper} from "./abstract-mapper.js";

describe('mapping', () => {

  it('map date', () => {
    class DummyClass {
      @PostMapping({ source: 'date', target: 'date', transform: (v) => new Date(v) })
      mapDate(input: any): any {
        return input;
      }
    }
    const dummyClass = new DummyClass();

    const input = {
      date: '2022-09-22T20:59:52Z'
    }

    const output = dummyClass.mapDate(input);

    expect(output['date'] instanceof Date).toBeTruthy();
  });

  it('should reverse', () => {
    class DummyClass {
      @PostMapping({ source: 'a', target: 'b' },
        {source: 'b', target: 'a'})
      mapReversedKey(input: any): any {
        return input;
      }
    }
    const dummyClass = new DummyClass();
    const input = {
      a: 1,
      b: 2
    }

    const output = dummyClass.mapReversedKey(input);

    expect(output).toEqual({
      b: 1,
      a: 2
    })
  });

  it('should handle method mapping', () => {
    class DummyClass {

      @PostMapping({ source: 'a', target: 'b', transform: (v) => v + 1000 })
      mapReversedKey(input: any): any {
        return input;
      }
    }
    const dummyClass = new DummyClass();
    const input = {
      a: 1,
      b: 2
    }

    const output = dummyClass.mapReversedKey(input);

    expect(output).toEqual({
      b: 1001,
      a: 1
    })
  });

  it('should handle root to root mapping', () => {
    class DummyClass {

      @PostMapping({ transform: (v) => ({ b: v.a }) })
      mapRoot(input: any): any {
        return input;
      }
    }
    const dummyClass = new DummyClass();
    const input = {
      a: 1
    }

    const output = dummyClass.mapRoot(input);

    expect(output).toEqual({
      b: 1
    })
  });

  it('should handle nested mappings', () => {
    class DummyClass {
      @PostMapping({ target: 'a.b', source: 'a'},
        { target: 'a.c', source: 'b' })
      mapNestedTarget(input: any): any {
        return input;
      }
    }
    const dummyClass = new DummyClass();
    const input = {
      a: 1,
      b: 2
    }

    const output = dummyClass.mapNestedTarget(input);

    expect(output).toEqual({
      a: {
        b: 1,
        c: 2
      },
      b: 2
    })
  });

  it('shoud easily map date from props', () => {
    class DummyClass {
      @PostDateMapping('creationDate', 'modificationDate')
      dateMapping(input: any): any {
        return input;
      }
    }
    const dummyClass = new DummyClass();
    const input = {
      creationDate: '2022-09-22T20:59:52Z',
      modificationDate: '2022-09-22T20:59:52Z'
    }

    const output = dummyClass.dateMapping(input);

    expect(output['creationDate'] instanceof Date).toBeTruthy();
    expect(output['modificationDate'] instanceof Date).toBeTruthy();
  })

  it('should map observable responses', (done) => {
    class DummyClass {
      @PostMapping({ target: 'a', source: 'b'})
      asyncResponse(input: any): Observable<any> {
        return of(input);
      }
    }
    const dummyClass = new DummyClass();
    const input = {
      b: 1
    };

    const output$ = dummyClass.asyncResponse(input);

    output$.subscribe(response => {
      expect(response).toEqual({
        a: 1,
        b: 1
      });
      done();
    })
  });

  it('should map promise responses', (done) => {
    class DummyClass {
      @PostMapping({ target: 'a', source: 'b'})
      asyncResponse(input: any): Promise<any> {
        return Promise.resolve(input);
      }
    }
    const dummyClass = new DummyClass();
    const input = {
      b: 1
    };

    const output$ = dummyClass.asyncResponse(input);

    output$.then(response => {
      expect(response).toEqual({
        a: 1,
        b: 1
      });
      done();
    })
  });

  it('should remove property if no mapping specified', () => {
    class DummyClass {
      @PostMapping({remove: 'b'})
      removeProperty(input: any): any {
        return input;
      }
    }
    const dummyClass = new DummyClass();
    const input = {
      a: 1,
      b: 2
    }

    const output = dummyClass.removeProperty(input);

    expect(output).toEqual({
      a: 1
    })
  });

  it('should use root as source if no source specified', () => {
    class DummyClass {
      @PostMapping({target: 'b'})
      removeProperty(input: any): any {
        return input;
      }
    }
    const dummyClass = new DummyClass();
    const input = {
      a: 1,
      b: 2
    }

    const output = dummyClass.removeProperty(input);

    expect(output).toEqual({
      a: 1,
      b: {
        a: 1,
        b: 2
      }
    })
  });

  it('should map array', () => {
    class DummyClass {
      @PostArrayMapping({ target: 'a', source: 'b'}, {remove: 'b'})
      arrayMapping(input: any[]): any[]{
        return input;
      }
    }
    const dummyClass = new DummyClass();
    const output = dummyClass.arrayMapping([{b: 1}, {b: 2}]);

    expect(output).toEqual([
      {
        a: 1
      },
      {
        a: 2
      }
    ])
  });

  it('should understand jsonPath expressions', () => {
    class DummyClass {
      @PostMapping({ target: 'a', source: '$.a.b[1].c'})
      arrayExpression(input: any): any{
        return input;
      }
    }
    const input = {
      a: {
        b: [0, {c:1}]
      },
      b: 2
    }
    const dummyClass = new DummyClass();
    const output = dummyClass.arrayExpression(input);

    expect(output).toEqual({
      a: 1,
      b: 2
    })
  });

  it('should understand jsonPath expressions with multiple result', () => {
    class DummyClass {
      @PostMapping({ target: 'a', multipleSources: '$.a.b[0,1]'})
      arrayExpression(input: any): any{
        return input;
      }
    }
    const input = {
      a: {
        b: [0, 1, 2]
      },
      b: 2
    }
    const dummyClass = new DummyClass();
    const output = dummyClass.arrayExpression(input);

    expect(output).toEqual({
      a: [0,1],
      b: 2
    })
  });

  it('should understand array expressions', () => {
    class DummyClass {
      @PostMapping({ target: 'a', source: 'a.b[1].c'})
      arrayExpression(input: any): any{
        return input;
      }
    }
    const input = {
      a: {
        b: [0, {c:1}]
      },
      b: 2
    }
    const dummyClass = new DummyClass();
    const output = dummyClass.arrayExpression(input);

    expect(output).toEqual({
      a: 1,
      b: 2
    })
  });

  it('should use additional args in method', () => {
    class DummyClass {

      @PostMapping({ target: 'language', source: 'language', transform: (v, arg) => arg[v] })
      additionnalArgs(input: any, languageMapping: {[k: string]: string}): any {
        return input;
      }
    }
    const dummyClass = new DummyClass();
    const input = {
      language: "FR"
    }

    const output = dummyClass.additionnalArgs(input, {FR: "français", EN: "English"});

    expect(output).toEqual({
      language: "français"
    })
  });

  it('should use injected mappers definition', () => {

    @ClassMapping({ target: 'subA', source: 'subB' }, {remove: 'subB'})
    class OtherDummyClass extends AbstractMapper<any, any> {

    }

    @ClassMapping({ target: 'a', source: 'b', transform: OtherDummyClass }, {remove: 'b'})
    class DummyClass extends AbstractMapper<any, any> {
      constructor(private otherDummyClass: OtherDummyClass) {
        super();
      }
    }
    const dummyClass = new DummyClass(new OtherDummyClass());
    const input = {
      b: {
        subB: 'test'
      }
    }

    const output = dummyClass.map(input);

    expect(output).toEqual({
      a: {
        subA: 'test'
      }
    })
  });

  it('should use mapper implementation in transform', () => {

    @ClassMapping({ target: 'subA', source: 'subB' }, {remove: 'subB'})
    class OtherDummyClass extends AbstractMapper<any, any> {

    }

    @ClassMapping({ target: 'a', source: 'b', transform: new OtherDummyClass() }, {remove: 'b'})
    class DummyClass extends AbstractMapper<any, any> {
    }
    const dummyClass = new DummyClass();
    const input = {
      b: {
        subB: 'test'
      }
    }

    const output = dummyClass.map(input);

    expect(output).toEqual({
      a: {
        subA: 'test'
      }
    })
  });

  it('should handle missing dependencies', () => {

    @ClassMapping({ target: 'subA', source: 'subB' }, {remove: 'subB'})
    class OtherDummyClass extends AbstractMapper<any, any> {}

    @ClassMapping({ target: 'a', source: 'b', transform: OtherDummyClass }, {remove: 'b'})
    class DummyClass extends AbstractMapper<any, any> {}

    const dummyClass = new DummyClass();
    const input = {
      b: {
        subB: 'test'
      }
    }

    const output = dummyClass.map(input);

    expect(output).toEqual({
      a: {
        subA: 'test'
      }
    })
  });

  it('should use available mappers in non AbstractMapper', () => {

    class OtherDummyClass extends AbstractMapper<any, any> {
      /* Do Nothing */
    }

    class ExtendedOtherDummyClass extends OtherDummyClass {
      public override map(s: any, ...args: any[]): any {
        return {
          key: 'overridden mapping'
        };
      }
    }

    class DummyClass {

      constructor(public selectedDummyClass: OtherDummyClass) {
      }

      @PostMapping({ target: 'a', source: 'b', transform: OtherDummyClass }, {remove: 'b'})
      map(input: any): any {
        return input;
      }
    }

    const dummyClass = new DummyClass(new ExtendedOtherDummyClass());
    const input = {
      b: {
        subB: 'test'
      }
    }

    const output = dummyClass.map(input);

    expect(output).toEqual({
      a: {
        key: 'overridden mapping'
      }
    })
  });

  it('should handle arrays with injected mappers definition', () => {

    @ClassMapping({ target: 'subA', source: 'subB' }, {remove: 'subB'})
    class OtherDummyClass extends AbstractMapper<any, any> {

    }

    @ClassMapping({ target: 'a', source: 'b', transformEach: OtherDummyClass }, {remove: 'b'})
    class DummyClass extends AbstractMapper<any, any> {
      constructor(private otherDummyClass: OtherDummyClass) {
        super();
      }
    }
    const dummyClass = new DummyClass(new OtherDummyClass());
    const input = {
      b: [
        {
          subB: 'test'
        },{
          subB: 'test2'
        }
      ]
    }

    const output = dummyClass.map(input);

    expect(output).toEqual({
      a: [
        {
          subA: 'test'
        },{
          subA: 'test2'
        }
      ]
    })
  });

  it('should handle arrays with method mapping', () => {

    @ClassMapping({ target: 'a', source: 'b', transformEach: (v) => ({subA: v['subB']}) }, {remove: 'b'})
    class DummyClass extends AbstractMapper<any, any> {}

    const dummyClass = new DummyClass();
    const input = {
      b: [
        {
          subB: 'test'
        },{
          subB: 'test2'
        }
      ]
    }

    const output = dummyClass.map(input);

    expect(output).toEqual({
      a: [
        {
          subA: 'test'
        },{
          subA: 'test2'
        }
      ]
    })
  });

  it('should handle overriden mappers with extends', () => {

    @ClassMapping({ target: 'parentProperty', source: 'parentPropertySource' }, {remove: 'parentPropertySource'})
    class ParentClass extends AbstractMapper<ParentSource, Parent> {}

    @ClassMapping({ target: 'childProperty', source: 'childPropertySource' }, {remove: 'childPropertySource'},
      { target: 'childProperty2', source: 'parentPropertySource' })
    class ChildClass extends ParentClass {}

    type ParentSource = {
      parentPropertySource: string
    }

    type ChildSource = ParentSource & {
      childPropertySource: string
    }

    type Parent = {
      parentProperty: string
    }

    type Child = Parent & {
      childProperty: string
      childProperty2: string
    }

    const childClass = new ChildClass();
    const input: ChildSource = {
      parentPropertySource: 'parent',
      childPropertySource: 'child'
    }

    const output: Child = childClass.map(input) as Child;

    expect(output).toEqual({
      parentProperty: 'parent',
      childProperty: 'child',
      childProperty2: 'parent',
    })
  });

  it('should map by providing only AbstractMapper class definition', () => {

    @ClassMapping({ target: 'target', source: 'source' }, {remove: 'source'})
    class Mapper extends AbstractMapper<Source, Target> {}

    class RandomClass {
      @PostMapping(Mapper)
      mapUsingOtherMapper(s: Source): Target {
        return s as unknown as Target;
      }
    }

    type Source = {
      source: string
    }

    type Target = {
      target: string
    }

    const clazz = new RandomClass();
    const input: Source = {
      source: 'value',
    }

    const output: Target = clazz.mapUsingOtherMapper(input);

    expect(output).toEqual({
      target: 'value',
    })
  });

  it('should map by providing only AbstractMapper implementation', () => {

    @ClassMapping({ target: 'target', source: 'source' }, {remove: 'source'})
    class Mapper extends AbstractMapper<Source, Target> {}

    class RandomClass {
      @PostMapping(new Mapper())
      mapUsingOtherMapper(s: Source): Target {
        return s as unknown as Target;
      }
    }

    type Source = {
      source: string
    }

    type Target = {
      target: string
    }

    const clazz = new RandomClass();
    const input: Source = {
      source: 'value',
    }

    const output: Target = clazz.mapUsingOtherMapper(input);

    expect(output).toEqual({
      target: 'value',
    })
  });

  it('should get the exact same results when giving minimal mappings info', () => {

    @ClassMapping({ transform: (v) => ({ b: v.a }) })
    class DummyMapper extends AbstractMapper<any, any> {

    }

    class DummyClass {

      @PostMapping({ transform: (v) => ({ b: v.a }) })
      transform(input: any): any {
        return input;
      }
      @PostMapping({ source: '', transform: (v) => ({ b: v.a }) })
      transformSource(input: any): any {
        return input;
      }
      @PostMapping({ target: '', transform: (v) => ({ b: v.a }) })
      transformTarget(input: any): any {
        return input;
      }
      @PostMapping({ source: '', target: '', transform: (v) => ({ b: v.a }) })
      transformSourceTarget(input: any): any {
        return input;
      }
      @PostMapping(new DummyMapper())
      classInstance(input: any): any {
        return input;
      }
      @PostMapping(DummyMapper)
      classType(input: any): any {
        return input;
      }
    }
    const dummyClass = new DummyClass();
    const input = {
      a: 1
    }

    const transformResult = dummyClass.transform(input);
    const transformSourceResult = dummyClass.transformSource(input);
    const transformTargetResult = dummyClass.transformTarget(input);
    const transformSourceTargetResult = dummyClass.transformSourceTarget(input);
    const classInstanceResult = dummyClass.classInstance(input);
    const classTypeResult = dummyClass.classType(input);
    expect(transformResult).toEqual({
      b: 1
    })
    expect(transformResult).toEqual(transformSourceResult)
    expect(transformSourceResult).toEqual(transformTargetResult)
    expect(transformTargetResult).toEqual(transformSourceTargetResult)
    expect(transformSourceTargetResult).toEqual(classInstanceResult)
    expect(classInstanceResult).toEqual(classTypeResult)
    expect(classTypeResult).toEqual(transformResult)
  });

  it('should reverse with multiple annotations', () => {
    @ClassMapping({source: 'a', target: 'b'})
    @ClassMapping({source: 'b', target: 'a'})
    class DummyClass extends AbstractMapper<any, any> {}
    const dummyClass = new DummyClass();
    const input = {
      a: 1,
      b: 2
    }

    const output = dummyClass.map(input);

    expect(output).toEqual({
      b: 1,
      a: 2
    })
  });

  it('should ignore when multiple annotations', () => {
    class DummyClass {
      @PostIgnore('b')
      @PostMapping({source: 'a', target: 'a', transform: (v) => v + 1000})
      mapReversedKey(input: any): any {
        return input;
      }
    }
    const dummyClass = new DummyClass();
    const input = {
      a: 1,
      b: 2
    }

    const output = dummyClass.mapReversedKey(input);

    expect(output).toEqual({
      a: 1001
    })
  });

});
