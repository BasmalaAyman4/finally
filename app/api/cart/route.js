/* // app/api/cart/route.js
import { NextResponse } from 'next/server';
import { auth } from '@/auth';

const API_URL = process.env.API_URL;

if (!API_URL) {
  console.error('❌ API_URL is missing from environment variables');
  throw new Error('API_URL is required');
}

export async function POST(request) {
  console.log('🛒 POST /api/cart called');

  try {
    // Get session
    const session = await auth();
    console.log('🔐 Session:', session ? 'Exists' : 'None');

    if (!session?.accessToken) {
      console.log('❌ No access token found');
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized - Please log in',
          detail: 'Authentication token missing'
        },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { productDetailId, qty, locale = 'ar' } = body;

    console.log('📦 Request data:', { productDetailId, qty, locale });

    // Validation
    if (!productDetailId || !qty) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
          detail: 'productDetailId and qty are required'
        },
        { status: 400 }
      );
    }

    // Prepare headers for backend API
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${session.accessToken}`,
      'langCode': locale === 'en' ? '2' : '1',
      'X-Client-Type': 'Web'
    };

    console.log('🚀 Calling backend API:', `${API_URL}/api/Cart`);

    // Call backend API
    const response = await fetch(`${API_URL}/api/Cart`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        productDetailId: parseInt(productDetailId),
        qty: parseInt(qty),
      }),
    });

    console.log('📡 Backend response status:', response.status);
    console.log('📡 Backend response content-type:', response.headers.get('content-type'));

    // Handle response based on content type
    let responseData;
    const contentType = response.headers.get('content-type');

    try {
      if (contentType && contentType.includes('application/json')) {
        // Response is JSON
        responseData = await response.json();
        console.log('📦 Backend response data (JSON):', responseData);
      } else {
        // Response is plain text or other format
        const textResponse = await response.text();
        console.log('📦 Backend response data (TEXT):', textResponse);

        // Wrap text response in an object
        responseData = {
          message: textResponse,
          rawResponse: textResponse
        };
      }
    } catch (parseError) {
      console.error('❌ Failed to parse backend response:', parseError);

      // Try to get raw text as fallback
      try {
        const rawText = await response.text();
        console.error('❌ Raw response text:', rawText);
        responseData = {
          message: rawText || 'Unknown error',
          rawResponse: rawText
        };
      } catch (textError) {
        console.error('❌ Could not read response as text:', textError);
        responseData = {
          message: 'Could not parse server response',
          rawResponse: null
        };
      }
    }

    if (!response.ok) {
      console.error('❌ Backend API error:', responseData);

      // Extract detailed error information from backend response
      const errorDetail = responseData.detail ||
        responseData.title ||
        responseData.message ||
        responseData.rawResponse ||
        'Unknown server error';
      const errorType = responseData.type || 'ServerError';
      const traceId = responseData.traceId;

      let userFriendlyMessage;

      // Map specific backend errors to user-friendly messages
      if (response.status === 400) {
        userFriendlyMessage = locale === 'ar'
          ? 'طلب غير صالح. يرجى التحقق من البيانات المرسلة.'
          : 'Invalid request. Please check the data sent.';
      } else if (response.status === 500) {
        userFriendlyMessage = locale === 'ar'
          ? 'خطأ في الخادم الداخلي. يرجى المحاولة مرة أخرى لاحقاً.'
          : 'Internal server error. Please try again later.';
      } else {
        userFriendlyMessage = locale === 'ar'
          ? 'فشل إضافة المنتج إلى السلة'
          : 'Failed to add product to cart';
      }

      return NextResponse.json(
        {
          success: false,
          error: userFriendlyMessage,
          detail: errorDetail,
          type: errorType,
          traceId: traceId,
          status: response.status,
          backendError: responseData // Include full backend error for debugging
        },
        { status: response.status }
      );
    }

    console.log('✅ Successfully added to cart');
    return NextResponse.json({
      success: true,
      data: responseData,
      message: locale === 'ar' ? 'تمت الإضافة إلى السلة بنجاح' : 'Added to cart successfully'
    });

  } catch (error) {
    console.error('💥 Cart POST error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        detail: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
} */

  // app/api/cart/route.js
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getApiLangCode } from '@/utils/locale';

const API_URL = process.env.API_URL;

if (!API_URL) {
  console.error('❌ API_URL is missing from environment variables');
  throw new Error('API_URL is required');
}

/**
 * Get fresh session with token refresh if needed
 */
async function getFreshSession() {
  const session = await auth();
  
  if (!session?.accessToken) {
    return null;
  }

  // Check if token is expired or about to expire
  const tokenExpires = session.accessTokenExpires || 0;
  const isExpiring = Date.now() >= tokenExpires - 2 * 60 * 1000; // 2 min buffer

  if (isExpiring && session.error === "RefreshAccessTokenError") {
    console.error('❌ Token refresh failed, user needs to re-login');
    return null;
  }

  return session;
}

/**
 * Parse response safely
 */
async function parseResponse(response) {
  const contentType = response.headers.get('content-type');
  
  try {
    if (contentType?.includes('application/json')) {
      return await response.json();
    }
    
    const text = await response.text();
    
    // Try to parse as JSON
    try {
      return JSON.parse(text);
    } catch {
      return { message: text, rawResponse: text };
    }
  } catch (error) {
    console.error('❌ Failed to parse response:', error);
    return { message: 'Failed to parse server response', rawResponse: null };
  }
}

/**
 * POST /api/cart - Add item to cart
 */
export async function POST(request) {
  console.log('🛒 POST /api/cart called');

  try {
    // Get fresh session with automatic token refresh
    const session = await getFreshSession();

    if (!session?.accessToken) {
      console.log('❌ No valid access token found');
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized - Please log in',
          errorCode: 'AUTH_REQUIRED',
          detail: 'Authentication token missing or expired'
        },
        { status: 401 }
      );
    }

    console.log('✅ Valid session found');

    // Parse request body
    const body = await request.json();
    const { productDetailId, qty, locale = 'ar' } = body;

    console.log('📦 Request data:', { productDetailId, qty, locale });

    // Validation
    if (!productDetailId || !qty) {
      return NextResponse.json(
        {
          success: false,
          error: locale === 'ar' ? 'بيانات غير كاملة' : 'Missing required fields',
          errorCode: 'VALIDATION_ERROR',
          detail: 'productDetailId and qty are required'
        },
        { status: 400 }
      );
    }

    if (qty <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: locale === 'ar' ? 'كمية غير صالحة' : 'Invalid quantity',
          errorCode: 'INVALID_QUANTITY',
          detail: 'Quantity must be greater than 0'
        },
        { status: 400 }
      );
    }

    // Prepare headers for backend API
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${session.accessToken}`,
      'langCode': getApiLangCode(locale),
      'X-Client-Type': 'Web',
      'webOrMob': '2'
    };

    console.log('🚀 Calling backend API:', `${API_URL}/api/Cart`);

    // Call backend API with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const response = await fetch(`${API_URL}/api/Cart`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        productDetailId: parseInt(productDetailId),
        qty: parseInt(qty),
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    console.log('📡 Backend response status:', response.status);

    // Parse response
    const responseData = await parseResponse(response);
    console.log('📦 Backend response data:', responseData);

    // Handle error responses
    if (!response.ok) {
      console.error('❌ Backend API error:', responseData);

      const errorDetail = responseData.detail ||
        responseData.title ||
        responseData.message ||
        responseData.rawResponse ||
        'Unknown server error';

      let userFriendlyMessage;

      if (response.status === 401) {
        userFriendlyMessage = locale === 'ar'
          ? 'انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.'
          : 'Session expired. Please log in again.';
      } else if (response.status === 400) {
        userFriendlyMessage = locale === 'ar'
          ? 'طلب غير صالح. يرجى التحقق من البيانات.'
          : 'Invalid request. Please check the data.';
      } else if (response.status === 500) {
        userFriendlyMessage = locale === 'ar'
          ? 'خطأ في الخادم. يرجى المحاولة مرة أخرى.'
          : 'Server error. Please try again.';
      } else {
        userFriendlyMessage = locale === 'ar'
          ? 'فشل إضافة المنتج إلى السلة'
          : 'Failed to add product to cart';
      }

      return NextResponse.json(
        {
          success: false,
          error: userFriendlyMessage,
          detail: errorDetail,
          errorCode: responseData.type || 'API_ERROR',
          type: responseData.type,
          traceId: responseData.traceId,
          status: response.status,
        },
        { status: response.status }
      );
    }

    console.log('✅ Successfully added to cart');
    return NextResponse.json({
      success: true,
      data: responseData,
      message: locale === 'ar' ? 'تمت الإضافة إلى السلة بنجاح' : 'Added to cart successfully'
    });

  } catch (error) {
    console.error('💥 Cart POST error:', error);

    // Handle timeout
    if (error.name === 'AbortError') {
      return NextResponse.json(
        {
          success: false,
          error: 'Request timeout',
          errorCode: 'TIMEOUT',
          detail: 'The request took too long to complete',
        },
        { status: 408 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        errorCode: 'SERVER_ERROR',
        detail: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cart - Get cart items
 */
export async function GET(request) {
  console.log('🛒 GET /api/cart called');

  try {
    const session = await getFreshSession();

    if (!session?.accessToken) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
          errorCode: 'AUTH_REQUIRED',
        },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const locale = searchParams.get('locale') || 'ar';

    const headers = {
      'Authorization': `Bearer ${session.accessToken}`,
      'langCode': getApiLangCode(locale),
      'X-Client-Type': 'Web',
      'webOrMob': '2'
    };

    const response = await fetch(`${API_URL}/api/Cart`, {
      method: 'GET',
      headers,
    });

    const responseData = await parseResponse(response);

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch cart',
          detail: responseData.detail || responseData.message,
        },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      data: responseData,
    });

  } catch (error) {
    console.error('💥 Cart GET error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        detail: error.message,
      },
      { status: 500 }
    );
  }
}