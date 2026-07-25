using WaaaHa__patcher.API.Utilities;

WelcomeMessage.Print();

var builder = WebApplication.CreateBuilder(args);

BuilderConfigurator.ConfigureThis(builder);

var app = builder.Build();

AppConfigurator.ConfigureThis(app);

Autoexec.Register(app);

app.Run();
