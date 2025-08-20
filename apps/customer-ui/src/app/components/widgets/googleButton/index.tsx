const GoogleButton = () => {
  return (
    <div className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-100 transition cursor-pointer">
      <img src="google-icon.png" alt="Google Icon" className="w-5 h-5" />
      <span className="text-sm font-medium text-gray-700">
        Sign in with Google
      </span>
    </div>
  );
};
export default GoogleButton;
