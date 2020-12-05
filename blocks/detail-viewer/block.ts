
import { BulmaColor, IconName, Remapper } from '@appsemble/sdk';

interface AbstractField {
  /**
   * The label that is presented to the user. No label will be displayed if this is not defined.
   */
  label?: Remapper;

  /**
   * The Remapper used to retrieve the data.
   */
  value?: Remapper;
}

interface AbstractMarkerIcon {
  /**
   * The anchor X and Y offset used for positioning the image.
   *
   * By default, the center of the icon will be used to mark the location. For many icons, it may
   * be desirable to customize this. For example, for a symmetric pin which has a width of 10, and a
   * height of 16, you’ll probably want to set this to `[5, 16]`
   *
   * The following special cases for [Font Awesome icon](https://fontawesome.com/icons?m=free) are
   * treated in a special way, since they are often used to represent a location:
   *
   * - `map-marker`
   * - `map-marker-alt`
   * - `map-pin`
   * - `thumbtrack`
   */
  anchor?: [number, number];

  /**
   * The height of marker icons in pixels.
   *
   * @default 28
   */
  size?: number;
}

/**
 * A marker based on a [Font Awesome icon](https://fontawesome.com/icons?m=free).
 */
interface FontAwesomeMarkerIcon extends AbstractMarkerIcon {
  /**
   * A [Font Awesome icon](https://fontawesome.com/icons?m=free) name to use.
   */
  icon?: IconName;

  /**
   * The color to apply to the icon.
   *
   * @default 'primary'
   */
  color?: BulmaColor;
}

/**
 * A marker based on an existing asset.
 */
interface AssetMarkerIcon extends AbstractMarkerIcon {
  /**
   * The id of an asset to use.
   */
  asset: string;
}

/**
 * Displays files as images.
 */
export interface FileField extends AbstractField {
  /**
   * Display one or multiple files.
   */
  repeated?: boolean;

  /**
   * The name of the property of the data to fetch from within each item.
   *
   * If not set, the item itself is used as the url.
   */
  repeatedName?: Remapper;

  /**
   * The name of the type of the field.
   */
  type: 'file';
}

/**
 * Displays a map with a marker.
 */
export interface GeoCoordinatesField extends AbstractField {
  /**
   * The path to base the longitude and latitude fields from.
   *
   * If `fields[].latitude` and `fields[].longitude` are not set it defaults to `fields[].name.lat`
   * and `fields[].name.lng`.
   */
  value?: Remapper;

  /**
   * The name of the field used to access the longitude value.
   *
   * If `fields[].name` is set it is retrieved relatively, otherwise it is fetched from the root of
   * the data.
   */
  latitude?: Remapper;

  /**
   * The name of the field used to access the latitude value.
   *
   * If `fields[].name` is set it is retrieved relatively, otherwise it is fetched from the root of
   * the data.
   */
  longitude?: Remapper;

  /**
   * The name of the type of the field.
   */
  type: 'geocoordinates';
}

/**
 * Displays the content as regular text.
 *
 * If the content is an object it will be converted using `JSON.stringify()`.
 */
export interface StringField extends AbstractField {
  /**
   * The name of the type of the field.
   */
  type?: 'string';
}

/**
 * All supported types of fields.
 */
export type Field = FileField | GeoCoordinatesField | StringField;

/**
 * A group of fields that is repeated for each item in it value.
 */
export interface FieldGroup extends AbstractField {
  /**
   * The list of fields to repeat.
   */
  fields: Field[];
}

export interface RendererProps<F extends Field> {
  /**
   * Structure used to define the field.
   */
  field: F;

  /**
   * The data that is passed through.
   */
  data: unknown;
}

declare module '@appsemble/sdk' {
  interface Parameters {
    /**
     * The base URL of the associated files.
     *
     * If not defined, Appsemble’s Asset API will be used instead.
     */
    fileBase?: string;

    /**
     * A list of fields to display based on the name from the schema.
     */
    fields: (Field | FieldGroup)[];

    /**
     * Custom icon configuration for geocoordinate fields.
     */
    icons?: AssetMarkerIcon | FontAwesomeMarkerIcon;
  }

  interface EventListeners {
    /**
     * The event that is triggered when data is received.
     *
     * Compatible data that is received will be displayed.
     */
    data: never;
  }
}