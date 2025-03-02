//Frontend Url
export const origin = 'http://localhost:3000';

//baseUrl's
export const baseUrl_auth = 'http://localhost:5000';
export const baseUrl_course = 'http://localhost:8070';
export const baseUrl_payment = 'http://localhost:8050';
export const baseUrl_course_content = 'http://localhost:8090';
export const baseUrl_notification = 'http://localhost:8020';
export const baseUrl_enrollment = 'http://localhost:8030';

//POST API's
export const API_POST_LOGIN = '/api/auth/login';
export const API_POST_REGISTER = '/api/auth/register';
export const API_POST_HANDLE_PAYMENT = '/api/payment/paymentrequest';
export const API_POST_PAYMENT = '/api/payment/checkout';
export const API_POST_COURSE = '/api/course/'
export const API_POST_COURSE_CONTENT = '/api/content/'
export const API_POST_NOTIFICATION = '/api/notification/'
export const API_POST_ENROLLMENT = '/api/enrollment/'

//GET API's
export const API_GET_USERS_BY_USERID = '/api/auth/users';
export const API_GET_COURSE_BY_COURSEID = '/api/course';
export const API_GET_COURSE_CONTENT_BY_CONTENTID = '/api/content/v2';
export const API_GET_ALL_COURSES = '/api/course/'
export const API_GET_ALL_COURSE_CONTENT = '/api/content/'
export const API_GET_ALL_USERS = '/api/auth/users'
export const API_GET_ALL_COURSE_CONTENT_BY_COURSEID = '/api/content/v1'
export const API_GET_ALL_PAYMENTS_BY_USERID = '/api/payment'
export const API_GET_ENROLLMENT_BY_USERID = '/api/enrollment'

//DELETE API's
export const API_DELETE_COURSE_BY_COURSEID = '/api/course';
export const API_DELETE_COURSE_CONTENT_BY_CONTENTID = '/api/content';

//UPDATE API's
export const API_UPDATE_COURSE = '/api/course'
export const API_UPDATE_CONTENT = '/api/content'