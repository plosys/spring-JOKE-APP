export interface Argv {
  // //////////////////////////////////////////////////////////////////////////////////////////// //
  // Logging                                                                                      //
  // //////////////////////////////////////////////////////////////////////////////////////////// //
  /**
   * Amount by which the logging verbosity is decreased from its default.
   */
  quiet: number;

  /**
   * Amount by which the logging verbosity is increased from its default.
   */
  verbose: number;

  // //////////////////////////////////////////////////////////////////////////////////////////// //
  // Hosting                                                                                      //
  // //////////////////////////////////////////////////////////////////////////////////////////// //
  /**
   * The hostname on which Appsemble Studio is served.
   */
  host: string;

  /**
   * The port on which Appsemble should be started.
   *
   * @default 9999
   */
  port: number;

  /**
   * This should be true of the HTTP proxy protocol is used.
   *
   * @default false
   */
  proxy: boolean;

  /**
   * The app secret. This is used for various things.
   */
  secret: string;

  /**
   * The key used for all the data that is encrypted using AES.
   */
  aesSecret: string;

  // //////////////////////////////////////////////////////////////////////////////////////////// //
  // DNS                                                                                          //
  // //////////////////////////////////////////////////////////////////////////////////////////// //
  /**
   * The strategy used to configure DNS.
   */
  appDomainStrategy: string;

  /**
   * The name of the Kubernetes server that’s serving Appsemble.
   */
  serviceName: string;

  /**
   * The exposed port of the Kubernetes server that’s serving Appsemble.
   */
  servicePort: string;

  /**
   * The hostname on which the Kubernetes API is available.
   *
   * @default 'kubernetes.default.svc'
   */
  kubernetesServiceHost: string;

  /**
   * The port on which the Kubernetes API is available.
   *
   * @default 443
   */
  kubernetesServicePort: number | string;

  /**
   * Kubernetes annotations to apply to the ingress as a JSON string.
   */
  ingressAnnotations: string;

  /**
   * The class name of the ingress.
   *
   * @default 'nginx'
   */
  ingressClassName: string;

  /**
   * The name of the cert-manager issuer to use for apps.
   */
  issuer?: string;

  /**
   * The name of the cert-manager cluster issuer to use for apps.
   */
  clusterIssuer?: string;

  // //////////////////////////////////////////////////////////////////////////////////////////// //
  // Database                                                                                     //
  // //////////////////////////////////////////////////////////////////////////////////////////// //
  /**
   * The hostname of the database.
   */
  databaseHost: string;

  /**
   * The port on which the database is accessed.
   */
  databasePort: number;

  /**
   * The username used to access the database.
   */
  databaseUser: string;

  /**
   * The password used to access the database.
   */
  databasePassword: string;

  /**
   * The name of the database to use.
   */
  databaseName: string;

  /**
   * Whether or not to use SSL for the database connection.
   *
   * @default false
   */
  databaseSsl: boolean;

  /**
   * The URL for the database. This replaces all other database options.
   */
  databaseUrl: string;

  /**
   * The version to migrate to.
   */
  migrateTo: string;

  // //////////////////////////////////////////////////////////////////////////////////////////// //
  // SSL                                                                                          //
  // //////////////////////////////////////////////////////////////////////////////////////////// //
  /**
   * Whether or not to use SSL
   *
   * @default false
   */
  ssl: boolea