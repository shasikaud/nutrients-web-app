declare global {
  interface Window {
    configs: {
      apiUrl: string;
    };
  }
}

export const apiUrl = 'http://localhost:8080/reading-list';
//export const apiUrl = window?.configs?.apiUrl ? window.configs.apiUrl : "/";
