// utils/
import validator from 'validator';
import DOMPurify from 'isomorphic-dompurify';

/**
 * تنظيف وتعقيم المدخلات من XSS و SQL Injection
 */
export const sanitizeInput = (input) => {
    if (typeof input !== 'string') return input;

    // إزالة HTML tags والمسافات الزائدة
    return validator.escape(validator.trim(input));

    
};

export const sanitizeHTML = (html) => {
    if (typeof html !== 'string') return '';
    
    return DOMPurify.sanitize(html, {
        ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li'],
        ALLOWED_ATTR: ['href', 'target', 'rel'],
    });
};


/**
 * Validate Egyptian mobile number
 */

/**
 * التحقق من صحة رقم الموبايل المصري
 */
export const validateMobile = (mobile) => {
    const sanitized = sanitizeInput(mobile);

    // رقم مصري: يبدأ بـ 01 ويتبعه 9 أرقام
    const egyptianMobileRegex = /^01[0-2,5]{1}[0-9]{8}$/;

    if (!sanitized) {
        return { valid: false, error: 'Mobile number is required' };
    }

    if (!egyptianMobileRegex.test(sanitized)) {
        return { valid: false, error: 'Invalid Egyptian mobile number' };
    }

    return { valid: true, value: sanitized };
};




/**
 * التحقق من صحة كلمة المرور
 */
export const validatePassword = (password) => {
    if (!password) {
        return { valid: false, error: 'Password is required' };
    }

    if (password.length < 8) {
        return { valid: false, error: 'Password must be at least 8 characters' };
    }

    // على الأقل حرف كبير، حرف صغير، ورقم
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);

    if (!hasUpperCase || !hasLowerCase || !hasNumber) {
        return {
            valid: false,
            error: 'Password must contain uppercase, lowercase, and number'
        };
    }

    return { valid: true, value: password };
};




/**
 * التحقق من OTP (6 أرقام)
 */
export const validateOTP = (otp) => {
    const sanitized = sanitizeInput(String(otp));

    if (!sanitized) {
        return { valid: false, error: 'OTP is required' };
    }

    if (!/^\d{6}$/.test(sanitized)) {
        return { valid: false, error: 'OTP must be 6 digits' };
    }

    return { valid: true, value: sanitized };
};




/**
 * التحقق من الاسم (عربي أو إنجليزي)
 */
export const validateName = (name, fieldName = 'Name') => {
    const sanitized = sanitizeInput(name);

    if (!sanitized) {
        return { valid: false, error: `${fieldName} is required` };
    }

    if (sanitized.length < 2) {
        return { valid: false, error: `${fieldName} must be at least 2 characters` };
    }

    if (sanitized.length > 50) {
        return { valid: false, error: `${fieldName} must be less than 50 characters` };
    }

    // السماح بالأحرف العربية والإنجليزية والمسافات فقط
    const nameRegex = /^[\u0600-\u06FFa-zA-Z\s]+$/;
    if (!nameRegex.test(sanitized)) {
        return { valid: false, error: `${fieldName} contains invalid characters` };
    }

    return { valid: true, value: sanitized };
};




/**
 * التحقق من تاريخ الميلاد
 */
export const validateBirthdate = (date) => {
    if (!date) {
        return { valid: false, error: 'Birthdate is required' };
    }

    const birthDate = new Date(date);
    const today = new Date();

    // حساب العمر
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }

    // يجب أن يكون العمر بين 13 و 120 سنة
    if (age < 13) {
        return { valid: false, error: 'You must be at least 13 years old' };
    }

    if (age > 120) {
        return { valid: false, error: 'Invalid birthdate' };
    }

    return { valid: true, value: birthDate.toISOString() };
};



/**
 * التحقق من الجنس
 */
export const validateGender = (gender) => {
    const validGenders = [1, 2]; // 1 = male, 2 = female

    if (!validGenders.includes(Number(gender))) {
        return { valid: false, error: 'Invalid gender value' };
    }

    return { valid: true, value: Number(gender) };
};




/**
 * التحقق من جميع بيانات التسجيل (الخطوة الأخيرة)
 */
export const validateUserData = (data) => {
    const errors = {};

    const firstNameValidation = validateName(data.firstName, 'First name');
    if (!firstNameValidation.valid) {
        errors.firstName = firstNameValidation.error;
    }

    const lastNameValidation = validateName(data.lastName, 'Last name');
    if (!lastNameValidation.valid) {
        errors.lastName = lastNameValidation.error;
    }

    const birthdateValidation = validateBirthdate(data.birthdate);
    if (!birthdateValidation.valid) {
        errors.birthdate = birthdateValidation.error;
    }

    const genderValidation = validateGender(data.gender);
    if (!genderValidation.valid) {
        errors.gender = genderValidation.error;
    }

    return {
        valid: Object.keys(errors).length === 0,
        errors,
        data: {
            firstName: firstNameValidation.value,
            lastName: lastNameValidation.value,
            birthdate: birthdateValidation.value,
            gender: genderValidation.value,
        }
    };
};