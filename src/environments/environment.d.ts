declare module 'src/environments/environment' {
  export const environment: {
    production: boolean;
    apiUrl: string;
    stripePublishKey: string;
    apiStaticUrl: string;

    adminCredentials: {
      email: string;
      password: string;
    };
    moderatorCredentials: {
      email: string;
      password: string;
    };
  };
}
