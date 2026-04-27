import { NextRequest, NextResponse } from "next/server";
import { AccessToken } from "livekit-server-sdk";

export async function POST(req: NextRequest) {
  try {
    const { roomId, userId, username } = await req.json();

    if (!roomId || !userId) {
      return NextResponse.json({ error: "roomId ve userId gerekli" }, { status: 400 });
    }

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;

    if (!apiKey || !apiSecret) {
      return NextResponse.json({ error: "LiveKit yapılandırılmamış" }, { status: 500 });
    }

    const token = new AccessToken(apiKey, apiSecret, {
      identity: userId,
      name: username || userId,
      ttl: "4h",
    });

    token.addGrant({
      roomJoin: true,
      room: roomId,
      canPublish: true,
      canSubscribe: true,
    });

    const jwt = await token.toJwt();
    return NextResponse.json({ token: jwt });
  } catch (e) {
    console.error("LiveKit token error:", e);
    return NextResponse.json({ error: "Token oluşturulamadı" }, { status: 500 });
  }
}
