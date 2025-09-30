const Footer = () => {
  return (
    <footer className="absolute bottom-0 left-0 w-full bg-blue-900 text-white py-4 text-center">
      <p className="text-sm">
        © {new Date().getFullYear()} Shift and Leave Management System
      </p>
    </footer>
  );
};
export default Footer;