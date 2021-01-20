
# Theming

By default Appsemble provides a default style based on the [Bulma CSS framework][bulma]. While this
is completely functional for end users, developers may be interested in further spicing up their
applications by applying their own style and branding.

To support this, Appsemble supports customizing the styling in two different ways: Theme options for
setting basic colors and custom styling for advanced or more specific styling.

## Theme options

The Bulma CSS framework uses a set of colors for different parts of its elements. Appsemble supports
customizing a subset of these variables by including a `theme` object at different points within an
app definition.

The supported variables are:

- `themeColor`
- `splashColor`
- `primaryColor`
- `linkColor`
- `successColor`
- `infoColor`
- `warningColor`
- `dangerColor`
- `font`
- `tileLayer`

The `themeColor` and `splashColor` variables are not visible at all times. These define the colors
that appear when starting up the app after installing it on a mobile device.

Each variable can be assigned with a [hexadecimal value][hex] representing the desired color.

They can be accessed in the CSS using custom variables using kebab-case, for example:
`background-color: var(--primary-color)`. An appropriately readable shade for the text of each color
can be found by appending `-invert` to the variable name.

The tile layer used on components that display a map (such as `map` and `form`) can be customized
using the `tileLayer` property by specifying a URL template.

The `font` property can be used to specify which font family to use. Any font family from [Google
Fonts][] may be used

### Example

```yaml copy
theme:
  primaryColor: '#229954'  # Green
  linkColor: '#D68910'     # Orange
  successColor: '#76448A'  # Purple

pages:
  - name: Red Page
    theme:
      primaryColor: '#FF0000' # Red
    blocks:
      - type: example
        version: 0.0.0
        theme:
          primaryColor: '#0000FF' # Blue
      - type: example
        ...
      ...
  - name: Some Other Page
    ...
```

The above example sets the app´s primary color to green, the color of its links to orange and the
color of ´success´ elements to purple. The page `Red Page` overwrites the primary color to be red
and one of its blocks overwrites the primary color to be blue instead.

If a theme variable is not overwritten, it will simply use the theme of its parent.

> Note: The above example does not represent a full app. It is merely a representation of how app
> themes can be defined.

### Bulma Extensions

On top of the base Bulma framework, extensions have been added that also benefit from all the
variables Bulma uses. The list of extensions is as follows:

- [`Checkradio`](https://wikiki.github.io/form/checkradio/)

### Appsemble classes

In addition to Bulma classes, Appsemble has defined the following classes in the core part of
Appsemble. These may also be used for styling.

| CSS Class               | Context               | Description                             |
| ----------------------- | --------------------- | --------------------------------------- |
| `.bottom-nav`           | Bottom app navigation | The container element.                  |
| `.bottom-nav-item`      | Bottom app navigation | A navigation list item.                 |
| `.bottom-nav-item-link` | Bottom app navigation | A link inside a list item.              |
| `.appsemble-login`      | The login page        | A container element for the login page. |

## Custom Styling

Custom styling is supported using a hierarchical model by allowing developers to upload CSS which
gets injected during the runtime of an application.

### Hierarchy

<span class="is-pulled-right"></span>

```mermaid
graph TD
    A(Block / Core style);
    A --> B(Shared style)
    B --> C["Default style (Bulma CSS)"]
```

**Core** styling gets applied to any part of an Appsemble application not related to a block, such
as the navigation bar, side menu, login view, message toasts, etc. The styling applied to the core
modules _do not_ get applied to blocks.

**Block** styling gets applied to a specific block.

**Shared** styling gets applied to each individual block as well as the Appsemble core. This is
useful for applying styles to elements that can appear in both the core modules as well as blocks,
such as input fields. It can also be used to apply [CSS variables][css-variables].

### Applying themes for an application

Open the Appsemble studio located at the base URL of Appsemble. Login, and create your first app.
Within the editor, tabs for `shared` and `core` are available. These tabs contain the current
styling for these modules. Tabs containing styling for specific blocks are automatically added and
removed depending on which blocks are used within the app definition.

To preview a style change, simply enter CSS in the corresponding tabs and press the `Save` button.
If the styling is satisfactory, it can be uploaded to the application by pressing the `Upload`
button.

Example shared styling:

```css copy
.input,
.button {
  border-radius: 0;
  box-shadow: 5px 5px #888888;
  font-family: serif;
}
```

Example core styling:

```css copy
.navbar {
  background-color: var(--primary-color) !important;
}

.navbar-item {
  color: var(--primary-color-invert) !important;
  padding: 0 !important;
}
```

Example block styling for `@appsemble/form`:

```css copy
form {
  max-width: initial !important;
  padding: 0 !important;
}

.field.is-horizontal {
  box-sizing: border-box;
  max-width: 100vw;
  padding: 0.5em 1em;
}
```

### Applying themes to specific pages or parts of pages

Specific pages and elements can be styled in the core styling by using the `data-` attributes that
are applied to pages. Each page has a `data-path` and a `data-path-index` attribute. The `data-path`
is a unique path calculated using Appsemble’s normalization function that represents a page or
block. For example, it could be `data-path="pages.example-page"`. `data-path-index` is the same,
except it uses the index of the page. For example `data-path-index="pages.0"`.

To target this using CSS:

```css copy
[data-path='pages.example-page'] {
  background-color: red;
}
```

The blocks within a page also have their own data properties applied to them. These are `data-path`,
`data-path-index`, and `data-type`. The property `data-path` looks similar to `data-path` on pages,
with `.blocks.` being added following by the index number of the block, such as:
`pages.example-page.blocks.1` for the second block on the first page. The `data-path-index` property
is the same as `data-path`, using the index of the page instead of the page’s internal name. The
`data-type` property contains the full name of the block. Both of these can be combined to target
specific blocks on specific pages.

```css copy
/* List blocks have a yellow background. */
[data-type='@appsemble/list'] {
  background-color: yellow;
}

/* List blocks on the first page have a blue background. */
[data-path-index='pages.0'] [data-type='@appsemble/list'] {
  background-color: blue;
}
```

## Using the CLI

Themes may also be uploaded as part of an app by the CLI. To do this, create a directory named
`theme` inside the app directory. Within the `themes` directory, the core style goes into
`core/index.css`, shared style into `shared/index.css`, and block styling into
`@<organizationId>/<blockId>/index.css`. An example app theme file structure could look like this:

```
my-app/
├── app-definition.yaml
└── theme/
    ├── @appsemble/
    │   └── form/
    │       └── index.css
    ├── core/
    │   └── index.css
    └── shared/
        └── index.css
```

Themes uploaded using the CLI support CSS modules. This means CSS can be imported using the
following syntax:

```css copy
@import 'other-file.css';
```

To do even more advanced CSS transformations, a custom `postcssrc` file can be created. See
[`postcss-load-config`][] for details.

[bulma]: https://bulma.io/
[hex]: https://htmlcolorcodes.com/
[css-variables]: https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_variables
[google fonts]: https://fonts.google.com
[`postcss-load-config`]: https://github.com/michael-ciniawsky/postcss-load-config