using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Configuration;

namespace AutoTrade.Infrastructure.Upstox.Security;

public interface ITokenEncryptor
{
    string Encrypt(string plainText);
    string Decrypt(string cipherText);
}

public class AesTokenEncryptor : ITokenEncryptor
{
    private readonly byte[] _key;

    public AesTokenEncryptor(IConfiguration configuration)
    {
        var secret = configuration["Upstox:EncryptionKey"] ?? "AutoTradeSecureTokenMasterKey2026";
        _key = SHA256.HashData(Encoding.UTF8.GetBytes(secret));
    }

    public string Encrypt(string plainText)
    {
        if (string.IsNullOrEmpty(plainText)) return plainText;

        using var aes = Aes.Create();
        aes.Key = _key;
        aes.GenerateIV();

        using var encryptor = aes.CreateEncryptor(aes.Key, aes.IV);
        var plainBytes = Encoding.UTF8.GetBytes(plainText);
        var encryptedBytes = encryptor.TransformFinalBlock(plainBytes, 0, plainBytes.Length);

        var combined = new byte[aes.IV.Length + encryptedBytes.Length];
        Array.Copy(aes.IV, 0, combined, 0, aes.IV.Length);
        Array.Copy(encryptedBytes, 0, combined, aes.IV.Length, encryptedBytes.Length);

        return Convert.ToBase64String(combined);
    }

    public string Decrypt(string cipherText)
    {
        if (string.IsNullOrEmpty(cipherText)) return cipherText;

        try
        {
            var combined = Convert.FromBase64String(cipherText);
            using var aes = Aes.Create();
            aes.Key = _key;

            var iv = new byte[aes.BlockSize / 8];
            var cipherBytes = new byte[combined.Length - iv.Length];

            Array.Copy(combined, 0, iv, 0, iv.Length);
            Array.Copy(combined, iv.Length, cipherBytes, 0, cipherBytes.Length);

            using var decryptor = aes.CreateDecryptor(aes.Key, iv);
            var plainBytes = decryptor.TransformFinalBlock(cipherBytes, 0, cipherBytes.Length);

            return Encoding.UTF8.GetString(plainBytes);
        }
        catch
        {
            return cipherText;
        }
    }
}
