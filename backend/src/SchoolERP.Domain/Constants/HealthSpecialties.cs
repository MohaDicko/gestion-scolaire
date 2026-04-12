namespace SchoolERP.Domain.Constants;

public static class HealthSpecialties
{
    public const string SMI = "Soins Maternels et Infantiles";
    public const string SP = "Santé Publique";
    public const string TLP = "Technicien de Laboratoire en Pharmacie";
    public const string BM = "Biologie Médicale";
    public const string SF = "Sage-Femme";
    public const string IDE = "Infirmier d'État";

    public static readonly Dictionary<string, string> All = new()
    {
        { "SMI", SMI },
        { "SP", SP },
        { "TLP", TLP },
        { "BM", BM },
        { "SF", SF },
        { "IDE", IDE }
    };
}
