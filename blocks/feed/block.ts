import { BulmaColor, IconName, Remapper } from '@appsemble/sdk';

interface Reply {
  /**
   * The field that is used to associate the ID of the resource this reply belongs to.
   */
  parentId?: string;

  /**
   * The author of the reply.
   *
   * @default [{ prop: '$author' }, { prop: 'name' }]
   */
  author?: Remapper;

  /**
   * The content of the reply.
   *
   * @default { prop: 'content' }
   */
  content?: Remapper;
}

interface BaseMarkerIcon {
  /**
   * The latitude of the marker.
   */
  latitude: Remapper;

  /**
   * The longitude of the marker.
   */
  longitude: Remapper;

  /**
   * The anchor X and Y offset used for positioning the image.
   *
   * By default, the center of the icon will be used to mark the location.
   * For many icons, it may be desirable to customize this. For example, for a symmetric pin
   * which has a width of 10, and a  height of 16, you’ll probably want to set this to `[5, 16]`
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
interface FontAwesomeMarkerIcon extends BaseMarkerIcon {
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
interface AssetMarkerIcon extends BaseMarkerIcon {
  /**
   * The id of an asset to use.
   */
  asset: string;
}

declare module '@appsemble/sdk' {
  interface Messages {
    /**
     * The name to display for replies without known user names.
     */
    anonymousLabel: never;

    /**
     * The error message shown when an error occurs while submitting a reply.
     */
    replyErrorMessage: never;

    /**
     * The placeholder text used for the reply input.
     */
    replyLabel: never;

    /**
     * The label that’s displayed when there are no feed items available.
     */
    emptyLabel: never;
  }

  interface Parameters {
    /**
     * The text that displays inside the button.
     */
    buttonLabel?: string;

    /**
     * The definition used to display replies.
     */
    reply?: Reply;

    /**
     * The base URL used to display pictures.
     *
     * If not defined, the Asset API will be used in