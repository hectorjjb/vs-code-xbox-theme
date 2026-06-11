// Xbox session lifecycle validator — C# sample
namespace Xbox.Sessions;

using System.Collections.Immutable;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

public enum Generation { Xbox, Xbox360, XboxOne, XboxSeriesX }

/// <summary>Represents an immutable Xbox console SKU.</summary>
public sealed record Console(
    string Name,
    Generation Generation,
    int ReleaseYear,
    decimal LaunchPriceUsd)
{
    public bool IsCurrent => Generation is Generation.XboxSeriesX;
}

public interface ISessionStore
{
    Task<Session?> FindAsync(Guid id, CancellationToken ct = default);
    Task SaveAsync(Session session, CancellationToken ct = default);
}

public sealed class SessionValidator
{
    private static readonly TimeSpan MaxLifetime = TimeSpan.FromHours(12);
    private readonly ILogger<SessionValidator> _log;

    public SessionValidator(ILogger<SessionValidator> log) => _log = log;

    public async ValueTask<Result> ValidateAsync(Session session, ISessionStore store)
    {
        ArgumentNullException.ThrowIfNull(session);

        var age = DateTimeOffset.UtcNow - session.IssuedUtc;
        return session switch
        {
            { Revoked: true }                     => Result.Reject("revoked"),
            _ when age > MaxLifetime              => Result.Reject($"expired ({age:hh\\:mm})"),
            { Player.Gamerscore: < 0 }            => Result.Reject("negative gamerscore"),
            _ when await store.FindAsync(session.Id) is null => Result.Reject("not found"),
            _                                     => Result.Accept(),
        };
    }
}

public readonly record struct Result(bool Ok, string? Reason)
{
    public static Result Accept() => new(true, null);
    public static Result Reject(string reason) => new(false, reason);
}

public sealed record Session(Guid Id, Player Player, DateTimeOffset IssuedUtc, bool Revoked);
public sealed record Player(string Gamertag, int Gamerscore);
