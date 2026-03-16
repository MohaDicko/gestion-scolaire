namespace SchoolERP.Application.Common.Models;

public class PaginatedResult<T>
{
    public List<T> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int CurrentPage { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => (int)Math.Ceiling(TotalCount / (double)PageSize);
    public bool HasPreviousPage => CurrentPage > 1;
    public bool HasNextPage => CurrentPage < TotalPages;

    public PaginatedResult(List<T> items, int count, int page, int pageSize)
    {
        Items = items;
        TotalCount = count;
        CurrentPage = page;
        PageSize = pageSize;
    }

    public static PaginatedResult<T> Create(List<T> items, int count, int page, int pageSize)
    {
        return new PaginatedResult<T>(items, count, page, pageSize);
    }
}
