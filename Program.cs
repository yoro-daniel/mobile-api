using MobileApi.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<AppDbContext>(opt =>
    opt.UseInMemoryDatabase("PostDb"));

builder.Services.AddControllers();

var app = builder.Build();

app.MapControllers();   
app.Run();