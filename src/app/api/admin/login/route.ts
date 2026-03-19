import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const { username, password } = await req.json();

        const adminUser = process.env.ADMIN_USERNAME || 'admin';
        const adminPass = process.env.ADMIN_PASSWORD || 'password';

        if (username === adminUser && password === adminPass) {
            // In a real production app, you would issue a JWT or set a secure cookie here.
            // For this implementation, we return success and use session management on the client.
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
