import { NextResponse } from "next/server";

export async function GET(request, { params }) {
    // Required by Next.js dynamic catch-all API route
    const { path } = await params;

    const ASSET_URL = process.env.NEXT_PUBLIC_ASSETS_URL;

    const filePath = path.join("/");

    // POINT THIS TO YOUR NODE BACKEND
    const backendUrl = `${ASSET_URL}/${filePath}`;

    const res = await fetch(backendUrl);

    if (!res.ok) {
        return new NextResponse("Not found", { status: 404 });
    }

    const data = await res.arrayBuffer();

    return new NextResponse(data, {
        status: 200,
        headers: {
            "Content-Type": res.headers.get("content-type") ?? "application/octet-stream",
            "Cache-Control": "no-cache",
        },
    });
}
