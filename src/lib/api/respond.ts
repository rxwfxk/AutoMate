import { NextResponse } from "next/server";

/** Consistent JSON shape for every API route: `{ error, data, msg }`. */
export function ok<T>(data: T, msg = "success", status = 200) {
  return NextResponse.json({ error: false, data, msg }, { status });
}

export function fail(msg: string, status = 400) {
  return NextResponse.json({ error: true, data: null, msg }, { status });
}
