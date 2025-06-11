import java.sql.*;

public class VulnerableLogin {

    public static void main(String[] args) {
        String username = "admin";  
        String password = "' OR '1'='1";  

        try {
            Connection conn = DriverManager.getConnection("jdbc:mysql://localhost/testdb", "root", "password");
            Statement stmt = conn.createStatement();

            String query = "SELECT * FROM users WHERE username = '" + username + "' AND password = '" + password + "'";
            ResultSet rs = stmt.executeQuery(query);

            if (rs.next()) {
                System.out.println("Login successful!");
            } else {
                System.out.println("Login failed!");
            }

            conn.close();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
