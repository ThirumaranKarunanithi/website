package software.magizhchi.crm.mailtemplate;

import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Tiny {{var}} merge engine. Supports dotted keys (lead.name, member.name,
 * company.name) plus any custom field referenced as {{field.<key>}}. Unknown
 * variables render as empty string.
 */
public final class MailMerge {

    private static final Pattern VAR = Pattern.compile("\\{\\{\\s*([a-zA-Z0-9_.]+)\\s*}}");

    private MailMerge() {}

    public static String render(String template, Map<String, String> vars) {
        if (template == null) return "";
        Matcher m = VAR.matcher(template);
        StringBuilder sb = new StringBuilder();
        while (m.find()) {
            String key = m.group(1);
            String val = vars.getOrDefault(key, "");
            m.appendReplacement(sb, Matcher.quoteReplacement(val == null ? "" : val));
        }
        m.appendTail(sb);
        return sb.toString();
    }

    /** The variable names a UI can offer as merge tags. */
    public static java.util.List<String> availableVars() {
        return java.util.List.of(
                "lead.name", "lead.phone", "lead.email",
                "member.name", "company.name");
    }
}
