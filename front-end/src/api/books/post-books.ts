import { apiUrl } from "./constants";
import { Book } from "./types/book";
import { performRequestWithRetry } from "../retry";

export async function postBooks(payload?: Book) {

  const options = {
    method: 'POST',
    data: payload,
  };

  const response = await performRequestWithRetry(`${apiUrl}/books`, options);
  return response;
}
