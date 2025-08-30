import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: "This endpoint has been deprecated. Please use the new access code system." },
    { status: 410 }
  );
}
