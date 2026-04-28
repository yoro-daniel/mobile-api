using Microsoft.AspNetCore.Mvc;
using MobileApi.Data;
using MobileApi.Models;

namespace MobileApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PostController : ControllerBase
    {
        private readonly AppDbContext _context;

        public PostController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public IActionResult Get() => Ok(_context.Posts.ToList());

        [HttpGet("{id}")]
        public IActionResult Get(int id)
        {
            var post = _context.Posts.Find(id);
            return post == null ? NotFound() : Ok(post);
        }

        [HttpPost]
        public IActionResult Create(Post post)
        {
            _context.Posts.Add(post);
            _context.SaveChanges();
            return Ok(post);
        }

        [HttpPut("{id}")]
        public IActionResult Update(int id, Post updated)
        {
            var post = _context.Posts.Find(id);
            if (post == null) return NotFound();

            post.Title = updated.Title;
            post.Content = updated.Content;
            _context.SaveChanges();

            return Ok(post);
        }

        [HttpDelete("{id}")]
        public IActionResult Delete(int id)
        {
            var post = _context.Posts.Find(id);
            if (post == null) return NotFound();

            _context.Posts.Remove(post);
            _context.SaveChanges();

            return Ok();
        }
    }
}