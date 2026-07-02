import { ApiError } from "@/lib/api/client";

type ApiMessageResult = {
  message?: string;
};

export function apiSuccessMessage(
  result: ApiMessageResult,
  fallbackMessage: string,
) {
  return result.message?.trim() || fallbackMessage;
}

export function apiErrorMessage(error: unknown, fallbackMessage: string) {
  return error instanceof ApiError ? error.message : fallbackMessage;
}
