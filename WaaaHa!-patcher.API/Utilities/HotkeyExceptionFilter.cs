using System.Net;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using WaaaHa__patcher.API.Application;
using WaaaHa__patcher.API.Contracts;

namespace WaaaHa__patcher.API.Utilities
{
    /// <summary>
    /// Превращает ошибки предметной области в единый формат ответа, сохраняя код,
    /// по которому интерфейс выбирает локализованный текст.
    /// </summary>
    public sealed class HotkeyExceptionFilter : IExceptionFilter
    {
        public void OnException(ExceptionContext context)
        {
            if (context.Exception is not HotkeyException exception)
                return;

            var (status, title) = exception.Code switch
            {
                HotkeyErrorCode.GameFolderNotFound => (HttpStatusCode.NotFound, exception.Message),
                HotkeyErrorCode.ProfileNotFound => (HttpStatusCode.NotFound, exception.Message),
                HotkeyErrorCode.SetNotFound or HotkeyErrorCode.BaseNotFound => (HttpStatusCode.NotFound, exception.Message),
                HotkeyErrorCode.FileNameTaken => (HttpStatusCode.Conflict, exception.Message),
                _ => (HttpStatusCode.BadRequest, exception.Message)
            };

            context.Result = new ObjectResult(new ApiError(exception.Code.ToString(), title, exception.Detail))
            {
                StatusCode = (int)status
            };

            context.ExceptionHandled = true;
        }
    }
}