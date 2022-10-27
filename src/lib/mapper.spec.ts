import {ArrayMapping, DateMapping, Ignore, Mapping} from "./decorator";
import {Observable, of} from "rxjs";
import {AbstractMapper} from "./abstract-mapper";

describe('mapping', () => {

  it('map date', () => {
    class DummyClass {
      @Mapping({ source: 'date', target: 'date', transform: (v) => new Date(v) })
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
      @Mapping({ source: 'a', target: 'b' },
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

      @Mapping({ source: 'a', target: 'b', transform: (v) => v + 1000 })
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

      @Mapping({ transform: (v) => ({ b: v.a }) })
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
      @Mapping({ target: 'a.b', source: 'a'},
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
      @DateMapping('creationDate', 'modificationDate')
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

  it('shoud easily map date with custom mapper', () => {

    @Mapping({transform: (v) => new Date(v)})
    class DateMapper extends AbstractMapper<string, Date> {}

    class DummyClass {
      @Mapping({sourceTarget: 'creationDate', transform: DateMapper})
      @Mapping({sourceTarget: 'modificationDate', transform: DateMapper})
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
      @Mapping({ target: 'a', source: 'b'})
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
      @Mapping({ target: 'a', source: 'b'})
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
      @Mapping({remove: 'b'})
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
      @Mapping({target: 'b'})
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
      @ArrayMapping({ target: 'a', source: 'b'}, {remove: 'b'})
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
      @Mapping({ target: 'a', source: '$.a.b[1].c'})
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
      @Mapping({ target: 'a', multipleSources: '$.a.b[0,1]'})
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
      @Mapping({ target: 'a', source: 'a.b[1].c'})
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

      @Mapping({ target: 'language', source: 'language', transform: (v, arg) => arg[v] })
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

    @Mapping({ target: 'subA', source: 'subB' }, {remove: 'subB'})
    class OtherDummyClass extends AbstractMapper<any, any> {

    }

    @Mapping({ target: 'a', source: 'b', transform: OtherDummyClass }, {remove: 'b'})
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

    @Mapping({ target: 'subA', source: 'subB' }, {remove: 'subB'})
    class OtherDummyClass extends AbstractMapper<any, any> {

    }

    @Mapping({ target: 'a', source: 'b', transform: new OtherDummyClass() }, {remove: 'b'})
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

    @Mapping({ target: 'subA', source: 'subB' }, {remove: 'subB'})
    class OtherDummyClass extends AbstractMapper<any, any> {}

    @Mapping({ target: 'a', source: 'b', transform: OtherDummyClass }, {remove: 'b'})
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

      @Mapping({ target: 'a', source: 'b', transform: OtherDummyClass }, {remove: 'b'})
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

    @Mapping({ target: 'subA', source: 'subB' }, {remove: 'subB'})
    class OtherDummyClass extends AbstractMapper<any, any> {

    }

    @Mapping({ target: 'a', source: 'b', transformEach: OtherDummyClass }, {remove: 'b'})
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

    @Mapping({ target: 'a', source: 'b', transformEach: (v) => ({subA: v['subB']}) }, {remove: 'b'})
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

    @Mapping({ target: 'parentProperty', source: 'parentPropertySource' }, {remove: 'parentPropertySource'})
    class ParentClass extends AbstractMapper<ParentSource, Parent> {}

    @Mapping({ target: 'childProperty', source: 'childPropertySource' }, {remove: 'childPropertySource'},
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

    @Mapping({ target: 'target', source: 'source' }, {remove: 'source'})
    class Mapper extends AbstractMapper<Source, Target> {}

    class RandomClass {
      @Mapping(Mapper)
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

    @Mapping({ target: 'target', source: 'source' }, {remove: 'source'})
    class Mapper extends AbstractMapper<Source, Target> {}

    class RandomClass {
      @Mapping(new Mapper())
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

    @Mapping({ transform: (v) => ({ b: v.a }) })
    class DummyMapper extends AbstractMapper<any, any> {

    }

    class DummyClass {

      @Mapping({ transform: (v) => ({ b: v.a }) })
      transform(input: any): any {
        return input;
      }
      @Mapping({ source: '', transform: (v) => ({ b: v.a }) })
      transformSource(input: any): any {
        return input;
      }
      @Mapping({ target: '', transform: (v) => ({ b: v.a }) })
      transformTarget(input: any): any {
        return input;
      }
      @Mapping({ source: '', target: '', transform: (v) => ({ b: v.a }) })
      transformSourceTarget(input: any): any {
        return input;
      }
      @Mapping(new DummyMapper())
      classInstance(input: any): any {
        return input;
      }
      @Mapping(DummyMapper)
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
    @Mapping({source: 'a', target: 'b'})
    @Mapping({source: 'b', target: 'a'})
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

  it('should ignore properties with @Ignore on AbstractMapper', () => {
    @Mapping({source: 'b', target: 'a'})
    @Ignore('b')
    class DummyClass extends AbstractMapper<any, any> {}
    const dummyClass = new DummyClass();
    const input = {
      b: 2
    }

    const output = dummyClass.map(input);

    expect(output).toEqual({
      a: 2
    })
  });

  it('should ignore when multiple annotations', () => {
    class DummyClass {
      @Ignore('b')
      @Mapping({source: 'a', target: 'a', transform: (v) => v + 1000})
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
