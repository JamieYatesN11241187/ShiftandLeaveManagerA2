import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'http://localhost:5001', // local
  //baseURL: 'http://13.55.186.158:5001', // EC2 instance live
  headers: { 'Content-Type': 'application/json' },
});

export default axiosInstance;
