using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Tamagochi.Data;

namespace Tamagochi.Controllers;

// Контроллер для CRUD-операций с питомцами (Tamagochi)
// Роут будет "api/tamagochi"
[ApiController]
[Route("api/[controller]")]
public class TamagochiController : ControllerBase
{
    private readonly TamagochiDbContext _db;

    public TamagochiController(TamagochiDbContext db) => _db = db;


    [HttpGet]
    public async Task<ActionResult<IEnumerable<Tamagochi.Models.Tamagochi>>> GetAll(CancellationToken ct)
        => Ok(await _db.Tamagochis.AsNoTracking().ToListAsync(ct));


    [HttpGet("{id:int}")]
    public async Task<ActionResult<Tamagochi.Models.Tamagochi>> GetById(int id, CancellationToken ct)
    {
        var item = await _db.Tamagochis
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id, ct);

        return item is null ? NotFound() : Ok(item);
    }


    [HttpPost]
    public async Task<ActionResult<Tamagochi.Models.Tamagochi>> Create(
        [FromBody] Tamagochi.Models.Tamagochi dto,
        CancellationToken ct)
    {
        _db.Tamagochis.Add(dto);

        await _db.SaveChangesAsync(ct);

        return CreatedAtAction(nameof(GetById), new { id = dto.Id }, dto);
    }


    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(
        int id,
        [FromBody] Tamagochi.Models.Tamagochi dto,
        CancellationToken ct)
    {
        if (id != dto.Id) return BadRequest();

        var entity = await _db.Tamagochis.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (entity is null) return NotFound();

        entity.Title = dto.Title;
        entity.Developer = dto.Developer;

        await _db.SaveChangesAsync(ct);

        return NoContent();
    }


    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        var entity = await _db.Tamagochis.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (entity is null) return NotFound();

        _db.Tamagochis.Remove(entity);

        await _db.SaveChangesAsync(ct);

        return NoContent();
    }
}
