#Property mapper

A solution to map structures in typescript Node projects. This solution provides decorators and types to make it easier to use.

## Quick start

Install the dependency
```shell
npm install @woodchopper/property-mapper
```

Mapper example:
```typescript
import {AbstractMapper, ClassMapping} from "@woodchopper/property-mapper";

@ClassMapping(
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