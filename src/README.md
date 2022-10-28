# Property mapper

A solution to map structures in typescript Node projects. This solution provides decorators and types to make it easier to use.

## Quick start

Install the dependency
```shell
npm install @woodchopper/property-mapper
```

Mapper example:
```typescript
import {AbstractMapper, Mapping} from "@woodchopper/property-mapper";

@Mapping(
    { source: 'fName', target: 'firstName' },
    { source: 'lName', target: 'lastName' }
)
export class MyFirstMapper extends AbstractMapper<UserInfo, UserDetails> {}
```

Usage:
```typescript
const userInfo: UserInfo = {
    fName: 'foo',
    lName: 'bar'
}

const userMapper = new MyFirstMapper();

const userDetails = userMapper.map(userInfo);

/*
userDetails.firstName is 'foo'
userDetails.lastName is 'bar'
 */
```

## Usage

Mapping annotation can decorate both classes and methods. 

### Dedicated mapper

When using the decorator at class level, the class needs to extends AbstractMapper<S, T>. S is the type of the source object while T is the target type.

AbstractMapper contains the methods `map` and `arrayMap` that cast the objets given in argument from S to T. This is the responsibility of your @Mapping decorators to map the input to an output that match T.

For those given types:
```typescript
type UserInfo = {
    fName: string
    lName: string
    age: number
};

type UserDetails = {
    firstName: string
    lastName: string
    age: number
};
```

A correct mapper would be:
```typescript
@Mapping(
    { source: 'fName', target: 'firstName' },
    { source: 'lName', target: 'lastName' }
)
export class UserMapper extends AbstractMapper<UserInfo, UserDetails> {}
```
or
```typescript
@Mapping({ source: 'fName', target: 'firstName' })
@Mapping({ source: 'lName', target: 'lastName' })
export class UserMapper extends AbstractMapper<UserInfo, UserDetails> {}
```

A property that is not mapped will simply go from the source to the target with the same key and value. In our example, `age` will be present on object of type UserDetails after the mapping.

#### Basic mapping instructions

`source` and `target` can define paths to properties. This path expression is defined by a string. the `source` expression support jsonPath syntax.

Example:
```typescript
@Mapping({ source: 'details.age', target: 'personnalDetails.age' })
export class UserMapper extends AbstractMapper<UserInfo, UserDetails> {}
```
Another example with jsonPath:
```typescript
@Mapping({ source: '$.details.phoneNumbers[:1].number', target: '$.personnalDetails.mainPhoneNumber' })
export class UserMapper extends AbstractMapper<UserInfo, UserDetails> {}
```

#### With multiple source

If the source provide multiple results, `multipleSources` needs to be used instead of `source`.

```typescript
@Mapping({ multipleSources: '$.details.phoneNumbers[:].number', target: '$.personnalDetails.phoneNumbers' })
export class UserMapper extends AbstractMapper<UserInfo, UserDetails> {}
```

Side note: a `jsonPath` expression always returns an array of results. When using `source`: the first element of the results will be used. When using `multipleSources`: all the elements of the result will be used.

#### With transformation

The mapping instruction can provide transformations:

Example:
```typescript
@Mapping({ source: 'lName', target: 'lastName', transform: (name: string) => name.toUpperCase() })
export class UserMapper extends AbstractMapper<UserInfo, UserDetails> {}
```

Or with a source that provide an array:
```typescript
@Mapping({ source: '$.details.phoneNumbers[:].number', target: '$.personnalDetails.phoneNumbers', transformEach: (phoneNumber: string) => phoneNumber.trim() })
export class UserMapper extends AbstractMapper<UserInfo, UserDetails> {}
```

When `source` and `target` share the same property name, you can use `sourceTarget`:
```typescript
@Mapping({ sourceTarget: 'lastName', transform: (name: string) => name.toUpperCase() })
export class UserMapper extends AbstractMapper<UserInfo, UserDetails> {}
```

#### With arguments

Arguments can be passed to the mapper:

```typescript
@Mapping({ source: 'lName', target: 'lastName', transform: (name: string, title: string) => title + ' ' + name })
export class UserMapper extends AbstractMapper<UserInfo, UserDetails> {}
```
```typescript
const userMapper = new UserMapper();

const userDetails = userMapper.map(userInfo, 'Dr.');
```
Using multiple arguments will result to this:

```typescript
@Mapping({ /* ... */ transform: (name: string, arg1: any, arg2: any, arg3: any) => /* ... */ })
/* ... */
userMapper.map(userInfo, arg1, arg2, arg3)
```

If you need to deal with a lot of arguments, a wise way to use it is by using a context object:
```typescript
@Mapping({ source: 'lName', target: 'lastName', transform: (name: string, context: {}) => context.title + ' ' + name })
@Mapping({ sourceTarget: 'phoneNumber', transform: (phoneNumber: string, context: {}) => context.phonePrefix + phoneNumber })
export class UserMapper extends AbstractMapper<UserInfo, UserDetails> {}
```
```typescript
const userMapper = new UserMapper();

const userDetails = userMapper.map(userInfo, { title: 'Dr.', phonePrefix: '+32' });
```

#### Using another AbstractMapper as dependency

Transformations can also use other mappers. This is useful when dealing with nested Objects of multiple types
```typescript
type UserInfo = {
    fName: string
    lName: string
};

type UserDetails = {
    firstName: string
    lastName: string
};

type Website = {
    numberOfActiveUsers: number,
    users: UserInfo[]
}

type WebsiteDetails = {
    activity: string,
    users: UserDetails
}
```

A correct mapper would be:
```typescript
@Mapping(
    { source: 'numberOfActiveUsers', target: 'activity', transform: (v: number) => v + ' of active users' },
    { sourceTarget: 'users', transformEach: UserMapper }
)
export class WebsiteMapper extends AbstractMapper<Website, WebsiteDetails> {}
```
or
```typescript
@Mapping(
    { source: 'numberOfActiveUsers', target: 'activity', transform: (v: number) => v + ' of active users' },
    { sourceTarget: 'users', transformEach: new UserMapper() }
)
export class WebsiteMapper extends AbstractMapper<Website, WebsiteDetails> {}
```

For some reason, you could provide your own implementation of UserMapper by injecting it:

```typescript
@Mapping(
    {source: 'numberOfActiveUsers', target: 'activity', transform: (v: number) => v + ' of active users'},
    {sourceTarget: 'users', transformEach: UserMapper}
)
export class WebsiteMapper extends AbstractMapper<Website, WebsiteDetails> {
    constructor(private userMapper: UserMapper) {
        super();
    }
}
```

```typescript
/**
 * overrides the mappings for firstName and lastname defined in UserMapper
 */
@Mapping({ target: 'firstName', transform: () => 'HIDDEN' })
@Mapping({ target: 'lastName', transform: () => 'HIDDEN' })
class GDPRCompliantUserMapper extends UserMapper {}
```
```typescript
const websiteMapper = new WebsiteMapper(new GDPRCompliantUserMapper());
const websiteDetails = websiteMapper.map(website);
```

#### Remove instruction

```typescript
type UserInfo = {
    fName: string
    lName: string
};

type UserDetails = {
    firstName: string
    lastName: string
};
```

All those examples provide ways from mapping UserInfo to UserDetails. While we expect user details to be a plain object of this form:
```json
{
    "firstName": "John",
    "lastName": "Doe"
}
```

It is in fact of this form:
```json
{
    "firstName": "John",
    "lastName": "Doe",
    "fName": "John",
    "lName": "Doe"
}
```
The properties of the source object remains. When working with this object, if you stick to the definition of the type UserDetails, you should not have any issue.

If those remaining properties bother you in you dev, you need to explicitly remove them:
```typescript
@Mapping({ source: 'fName', target: 'firstName' }, { remove: 'fName'})
@Mapping({ source: 'lName', target: 'lastName' }, { remove: 'lName'})
export class UserMapper extends AbstractMapper<UserInfo, UserDetails> {}
```

Or
```typescript
@Ignore('fName', 'lName')
@Mapping({ source: 'fName', target: 'firstName' })
@Mapping({ source: 'lName', target: 'lastName' })
export class UserMapper extends AbstractMapper<UserInfo, UserDetails> {}
```

You will get:
```json
{
    "firstName": "John",
    "lastName": "Doe"
}
```

#### Angular injection

When working with the annotation `@Injectable` from Angular, you could get issues while trying to inject a mapper. You need to explicitly provide the mapper in you Module:

```typescript
@Injectable()
@Mapping({ source: 'fName', target: 'firstName' })
@Mapping({ source: 'lName', target: 'lastName' })
export class UserMapper extends AbstractMapper<UserInfo, UserDetails> {}
```
```typescript
@NgModule({
    /* ... */
  providers: [
      /* ... */
    {
      provide: MapperClassService,
      useValue: new MapperClassService()
    }
      /* ... */
  ],
    /* ... */
})
export class AppModule { }
```

### Mapping on methods

The decorator can also be used on class methods. This feature can be used to perform some small mapping.

Example:
```typescript
type UserInfo = {
    fName: string
    lName: string
    inscriptionDate: Date
};
```
```typescript
class UserClient {
    constructor(/* an async http client */) {}

    @Mapping({sourceTarget: 'inscriptionDate', transform: (date: string) => new Date(date)})
    getUser(id: string): Observable<UserInfo> {
        /* some async call to an API */
    }
}
```
Here the Mapping instruction convert the date in format `string` to an object of type `Date`. So that the model `UserInfo` is respected.

Those method mappings can be performed on methods returning objects of type Observable, Promise or plain objects.

It can also be used on Array return types:
```typescript
class UserClient {
    constructor(/* an async http client */) {}

    @Mapping({sourceTarget: 'inscriptionDate', transform: (date: string) => new Date(date)})
    getAllUsers(id: string): Observable<UserInfo[]> {
        /* some async call to an API */
    }
}
```
