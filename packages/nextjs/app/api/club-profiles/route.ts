import { NextResponse } from 'next/server';
import { clubProfiles } from '../../../lib/api/profileQueries';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const creatorId = searchParams.get('creatorId');

  try {
    if (id) {
      const profile = await clubProfiles.getById(id);
      return NextResponse.json(profile);
    }
    
    if (creatorId) {
      const profiles = await clubProfiles.getByCreatorId(creatorId);
      return NextResponse.json(profiles);
    }
    
    return NextResponse.json({ error: 'Missing id or creatorId parameter' }, { status: 400 });
  } catch (error: any) {
    console.error('Failed to fetch club profile:', error);
    return NextResponse.json({
      error: 'Failed to fetch club profile',
      details: error?.message || String(error)
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const result = await clubProfiles.create(data);
    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error('Failed to create club profile:', error);
    return NextResponse.json({
      error: 'Failed to create club profile',
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
    const result = await clubProfiles.update(id, data);
    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error('Failed to update club profile:', error);
    return NextResponse.json({
      error: 'Failed to update club profile',
      details: error?.message || String(error)
    }, { status: 500 });
  }
}