using Microsoft.AspNetCore.Http;

namespace MyWebApi.Services
{
    public static class FileService
    {
        public static async Task<string> UploadFileAsync(IFormFile file, string folderName)
        {
            if (file == null || file.Length == 0)
                return "";

            // สร้างโฟลเดอร์ปลายทางถ้ายังไม่มี
            var uploadPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "upload", folderName);
            if (!Directory.Exists(uploadPath))
            {
                Directory.CreateDirectory(uploadPath);
            }

            // ตั้งชื่อไฟล์สุ่ม
            var ext = Path.GetExtension(file.FileName);
            var fileName = $"{Guid.NewGuid()}{ext}";
            var fullPath = Path.Combine(uploadPath, fileName);

            using (var stream = new FileStream(fullPath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            // return path ที่ frontend ใช้ได้ เช่น /upload/profile/xxx.png
            return $"/upload/{folderName}/{fileName}";
        }
    }
}