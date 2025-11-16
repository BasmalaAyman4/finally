// app/api/checkout/route.js
import { auth } from '@/auth';
import { API_CONFIG } from '@/utils/constants';
import { getApiLangCode } from '@/utils/locale';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    // 1. Authenticate user
    const session = await auth();
    console.log('Session exists:', !!session);
    console.log('Access token exists:', !!session?.accessToken);
    
    if (!session?.accessToken) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Parse request body
    const body = await request.json();
    console.log('Request body:', JSON.stringify(body, null, 2));

    // 3. Validate required fields
    const { cartIds, addressId, patmentType } = body;
    
    if (!cartIds || !Array.isArray(cartIds) || cartIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Cart IDs are required' },
        { status: 400 }
      );
    }
    
    if (!addressId) {
      return NextResponse.json(
        { success: false, error: 'Address ID is required' },
        { status: 400 }
      );
    }

    // 4. Get locale from headers
    const locale = request.headers.get('x-locale') || 'ar';
    const langCode = getApiLangCode(locale);
    console.log('Locale:', locale, 'LangCode:', langCode);

    // 5. Prepare headers for external API
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.accessToken}`,
      'langCode': langCode,
      'Accept': 'application/json',
      'X-Client-Type':'Web'
    };

    console.log('Calling external API:', `${API_CONFIG.BASE_URL}/api/Checkout`);

    // 6. Call external API with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000);

    const response = await fetch(`${API_CONFIG.BASE_URL}/api/Checkout`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    console.log('External API response status:', response.status);
    console.log('External API response headers:', Object.fromEntries(response.headers));

    // 7. Handle response - check content type
    const contentType = response.headers.get('content-type') || '';
    let data;
    let responseText;

    if (contentType.includes('application/json')) {
      data = await response.json();
      console.log('External API JSON response:', data);
    } else {
      responseText = await response.text();
      console.log('External API non-JSON response:', responseText.substring(0, 500));
      
      // Try to extract error message from HTML or text
      let errorMessage = `External API error: ${response.status} ${response.statusText}`;
      
      // If it's HTML, try to find error in common patterns
      if (responseText.includes('error') || responseText.includes('exception')) {
        // Extract meaningful parts
        const errorMatch = responseText.match(/(error|exception)[^<]*/i);
        if (errorMatch) {
          errorMessage += ` - ${errorMatch[0].substring(0, 100)}`;
        }
      }
      
      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
          details: responseText.substring(0, 200)
        },
        { status: response.status }
      );
    }

    // 8. Handle API response
    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: data?.message || data?.error || `Checkout failed: ${response.status}`,
          details: data
        },
        { status: response.status }
      );
    }

    // 9. Success response
    return NextResponse.json({
      success: true,
      data: data,
      message: 'Order created successfully'
    });

  } catch (error) {
    console.error('[Checkout API Error Details]:', error);

    if (error.name === 'AbortError') {
      return NextResponse.json(
        { success: false, error: 'Request timeout. Please try again.' },
        { status: 408 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error. Please try again later.',
        ...(process.env.NODE_ENV === 'development' && { 
          details: error.message,
          stack: error.stack 
        })
      },
      { status: 500 }
    );
  }
}