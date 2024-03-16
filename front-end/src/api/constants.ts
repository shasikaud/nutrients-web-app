declare global {
  interface Window {
    configs: {
      apiUrl: string;
    };
  }
}

//export const apiUrl = 'http://localhost:8080/app';
export const apiUrl = window?.configs?.apiUrl ? window.configs.apiUrl : "/";