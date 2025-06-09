import { NextResponse } from 'next/server';
import { businessProfiles } from '../../../lib/api/profileQueries';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const userId = searchParams.get('userId');

  try {
    if (id) {
      const profile = await businessProfiles.getById(id);
      return NextResponse.json(profile);
    }
    
    if (userId) {
      const profiles = await businessProfiles.getByUserId(userId);
      return NextResponse.json(profiles);
    }
    
    return NextResponse.json({ error: 'Missing id or userId parameter' }, { status: 400 });
  } catch (error: any) {
    console.error('Failed to fetch business profile:', error);
    return NextResponse.json({
      error: 'Failed to fetch business profile',
      details: error?.message || String(error)
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const result = await businessProfiles.create(data);
    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error('Failed to create business profile:', error);
    return NextResponse.json({
      error: 'Failed to create business profile',
      details: error?.message || String(error)
    }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 });
  }

  try {
    const data = await request.json();
    const result = await businessProfiles.update(id, data);
    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error('Failed to update business profile:', error);
    return NextResponse.json({
      error: 'Failed to update business profile',
      details: error?.message || String(error)
    }, { status: 500 });
  }
}