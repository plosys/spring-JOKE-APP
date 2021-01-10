# Basic app

Each app has a name, description, and a default page. Notice the name and description have the value
that was entered in the _“Create new app”_ dialog.

## Empty app

The newly created app has two pages. On each page, an
[`action-button`](/blocks/@appsemble/action-button) block is rendered.

The icon on the button is specified in the block parameters. Because each block type has different
functionalities, they also accept different types of parameters.

Each block type may also call specific types of actions. In case of the `action-button`, the button
may be clicked. This is why it has an `onClick` event. When the button on _“Example Page A”_ is
clicked, a `link` action is called. This will link the user to _“Example Page B”_. Vice-versa,
_“Example Page B”_ has a button that links to _“Example Page A”_.

## Adding a resource

Resources allow apps to store data in the Appsemble resource API, or to map resources to somewhat
compliant third party APIs. This tutorial will focus on usage with Appsemble’s own resource API.

Add the following to the app definition at the root of the YAML:

```yaml copy
resources:
  person:
    roles: [$public]
    schema:
      type: object
      additionalProperties: false # Custom properties are disallowed to ensure the shape of each person resource is fixed.
      required:
        - firstName
        - lastName
        - email
      properties:
        firstName:
          type: string
          maxLength: 80
        lastName:
          type: string
          maxLength: 80
        email:
          type: string
          format: email
        description:
          type: string
          maxLength: 500
```

This may look daunting at first, but it’s not that complicated when given a closer look. This
specified a resource named `person`. Resources have a `schema` property. This `schema` property is a
[JSON schema](https://json-schema.org/draft/2019-09/json-schema-validation.html). Such schemes allow
complex structures, but typically this isn’t needed for resources. The person schema describes an
object which has the properties `firstName`, `lastName`, `email`, and `description`. `firstName` and
`lastName` shouldn’t be too long, whereas `email` should be a valid email address. For example, this
could represent the following data structure:

```json
{
  "firstName": "John",
  "lastName": "Smith",
  "email": "john.smith@example.com",
  "description": "This is the best smith in town."
}
```

The schema is used as a safety net for invalid data, but also fo