import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'http://localhost:5001', // local
  baseURL: 'http://3.25.197.207:5001', // live
  //baseURL: '/api', // live
  headers: { 'Content-Type': 'application/json' },
});

export default axiosInstance;
