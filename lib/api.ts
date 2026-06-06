import { NextResponse } from "next/server";
import type { ZodError } from "zod";

export const unauthorized = () =>
  NextResponse.json({ error: "Unauthorized" }, { status: 401 });

export const notFound = () =>
  NextResponse.json({ error: "Not found" }, { status: 404 });

export const badRequest = (err: ZodError) =>
  NextResponse.json({ error: "Validation error", issues: err.issues }, { status: 400 });

export const internalError = () =>
  NextResponse.json({ error: "Internal server error" }, { status: 500 });
