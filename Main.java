import java.sql.*;
import java.util.Scanner;

public class VulnerableLogin {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);

        System.out.print("Enter username: ");
        String user = scanner.nextLine();

        System.out.print("Enter password: ");
        String pass = scanner.nextLine();

        try {
            Connection conn = DriverManager.getConnection(
                "jdbc:mysql://localhost:3306/mydb", "root", "password");

            Statement stmt = conn.createStatement();
            String query = "SELECT * FROM users WHERE username = '" + user + "' AND password = '" + pass + "'";

            ResultSet rs = stmt.executeQuery(query);

            if (rs.next()) {
                System.out.println("Login successful!");
            } else {
                System.out.println("Invalid credentials.");
            }

            conn.close();
        } catch (SQLException e) {
            e.printStackTrace();
        }
        scanner.close();
    }
}
