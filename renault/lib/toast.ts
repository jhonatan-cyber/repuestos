import { sileo, type SileoOptions } from "sileo"

type ToastInput = string | SileoOptions

function normalizeInput(input: ToastInput): SileoOptions {
  return typeof input === "string" ? { description: input } : input
}

export const toast = {
  success: (input: ToastInput) => sileo.success(normalizeInput(input)),
  error: (input: ToastInput) => sileo.error(normalizeInput(input)),
  info: (input: ToastInput) => sileo.info(normalizeInput(input)),
  warning: (input: ToastInput) => sileo.warning(normalizeInput(input)),
  message: (input: ToastInput) => sileo.show(normalizeInput(input)),
}
